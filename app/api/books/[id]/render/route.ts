import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"
import { generateBookPDF } from "@/lib/pdf"
import type { Book, Entry, Person } from "@/lib/types"

export const runtime = "nodejs"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const household = await getCurrentHousehold()
    if (!household) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 404 }
      )
    }

    // Get book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    // Update status to rendering
    await supabase
      .from("books")
      .update({ status: "rendering" })
      .eq("id", id)

    // Get entries for date range
    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("*")
      .eq("household_id", household.id)
      .gte("entry_date", book.date_start)
      .lte("entry_date", book.date_end)
      .order("entry_date", { ascending: true })

    if (entriesError) throw entriesError

    // Get persons
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", household.id)

    if (personsError) throw personsError

    const personsMap: Record<string, Person> = {}
    persons?.forEach((person) => {
      personsMap[person.id] = person
    })

    // Get tags
    if (entries && entries.length > 0) {
      const entryIds = entries.map((e) => e.id)
      const { data: tagsData } = await supabase
        .from("entry_tags")
        .select("*")
        .in("entry_id", entryIds)

      const tagsMap: Record<string, string[]> = {}
      tagsData?.forEach((tag) => {
        if (!tagsMap[tag.entry_id]) {
          tagsMap[tag.entry_id] = []
        }
        tagsMap[tag.entry_id].push(tag.tag)
      })

      // Generate PDF
      const pdfBuffer = await generateBookPDF({
        book: book as Book,
        entries: entries as Entry[],
        persons: personsMap,
        tags: tagsMap,
      })

      // Upload to Supabase Storage using service role
      const serviceClient = await createServiceRoleClient()
      const fileName = `books/${id}/${Date.now()}.pdf`
      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from("attachments")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = serviceClient.storage.from("attachments").getPublicUrl(fileName)

      // Update book with PDF URL
      await supabase
        .from("books")
        .update({
          status: "ready",
          pdf_url: publicUrl,
        })
        .eq("id", id)

      return NextResponse.json({ success: true, url: publicUrl })
    } else {
      // No entries, mark as error
      await supabase
        .from("books")
        .update({ status: "error" })
        .eq("id", id)

      return NextResponse.json(
        { error: "No entries found for date range" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    // Update book status to error
    try {
      const { id } = await params
      const supabase = await createClient()
      await supabase
        .from("books")
        .update({ status: "error" })
        .eq("id", id)
    } catch {}

    return NextResponse.json(
      { error: error.message || "Failed to render book" },
      { status: 500 }
    )
  }
}




