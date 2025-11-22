import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"
import { generateBookPDF, generateManualBookPDF } from "@/lib/pdf"
import type { Book, Entry, Person, BookPage, BookPhoto } from "@/lib/types"

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

    // Check if book has manually designed pages
    const { data: pages, error: pagesError } = await supabase
      .from("book_pages")
      .select("*")
      .eq("book_id", id)
      .order("page_number", { ascending: true })

    console.log(`[PDF Render] Book ${id}: Found ${pages?.length || 0} pages`, {
      pagesError: pagesError?.message,
      pageNumbers: pages?.map((p) => p.page_number),
      hasContent: pages?.some((p) => 
        (p.left_layout && (p.left_content?.length || 0) > 0) || 
        (p.right_layout && (p.right_content?.length || 0) > 0)
      ),
    })

    // Get entries for date range (needed for both manual and auto modes)
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

    let pdfBuffer: Buffer

    // Check if pages have actual content (layouts and content items)
    const hasManualPages = pages && pages.length > 0 && pages.some((page) => 
      (page.left_layout && page.left_content && (page.left_content as any[]).length > 0) ||
      (page.right_layout && page.right_content && (page.right_content as any[]).length > 0)
    )

    console.log(`[PDF Render] Using ${hasManualPages ? 'MANUAL' : 'AUTO-GENERATE'} mode`)

    // If manually designed pages exist, use them; otherwise auto-generate
    if (hasManualPages && !pagesError) {
      // Get book photos
      const { data: photos, error: photosError } = await supabase
        .from("book_photos")
        .select("*")
        .eq("book_id", id)
        .order("created_at", { ascending: false })

      if (photosError) throw photosError

      // Generate signed URLs for photos
      const serviceClient = await createServiceRoleClient()
      const photosWithUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          if (photo.path) {
            const { data: signedUrlData, error: signedUrlError } = await serviceClient.storage
              .from("attachments")
              .createSignedUrl(photo.path, 3600) // 1 hour expiry
            if (!signedUrlError && signedUrlData) {
              return { ...photo, url: signedUrlData.signedUrl }
            }
          }
          return photo
        })
      )

      // Parse JSONB content fields
      const formattedPages = pages.map((page) => ({
        ...page,
        left_content: (page.left_content as any) || [],
        right_content: (page.right_content as any) || [],
      }))

      console.log(`[PDF Render] Formatted pages:`, formattedPages.map((p) => ({
        page_number: p.page_number,
        left_layout: p.left_layout,
        right_layout: p.right_layout,
        left_content_count: (p.left_content as any[]).length,
        right_content_count: (p.right_content as any[]).length,
      })))

      // Generate PDF from manually designed pages
      pdfBuffer = await generateManualBookPDF({
        book: book as Book,
        pages: formattedPages as BookPage[],
        photos: photosWithUrls as BookPhoto[],
        entries: entries as Entry[],
        persons: personsMap,
      })
    } else {
      // Auto-generate from entries (old method)
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
        pdfBuffer = await generateBookPDF({
          book: book as Book,
          entries: entries as Entry[],
          persons: personsMap,
          tags: tagsMap,
        })
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
    }

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





