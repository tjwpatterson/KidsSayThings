"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import { regenerateBookFromEntries } from "@/lib/books/auto-generate"

export async function POST(request: Request) {
  try {
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

    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const requestedYear = Number(body?.year)
    const targetYear = Number.isInteger(requestedYear)
      ? requestedYear
      : now.getFullYear()

    const dateStart = `${targetYear}-01-01`
    const dateEnd = `${targetYear}-12-31`
    const defaultTitle = `${targetYear} Family Quotes`

    const { data: existingBook } = await supabase
      .from("books")
      .select("*")
      .eq("household_id", household.id)
      .eq("date_start", dateStart)
      .eq("date_end", dateEnd)
      .maybeSingle()

    let bookRecord = existingBook

    if (bookRecord) {
      const { data: updatedBook, error: updateError } = await supabase
        .from("books")
        .update({
          title: defaultTitle,
          status: "draft",
          design_mode: "auto",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookRecord.id)
        .select()
        .single()

      if (updateError) throw updateError
      bookRecord = updatedBook
    } else {
      const { data: insertedBook, error: insertError } = await supabase
        .from("books")
        .insert({
          household_id: household.id,
          title: defaultTitle,
          date_start: dateStart,
          date_end: dateEnd,
          design_mode: "auto",
          status: "draft",
        })
        .select()
        .single()

      if (insertError) throw insertError
      bookRecord = insertedBook
    }

    const { pages } = await regenerateBookFromEntries({
      supabase,
      bookId: bookRecord.id,
      householdId: household.id,
      dateStart,
      dateEnd,
    }).catch((error) => {
      if (error?.message?.includes("No entries")) {
        throw new Error("No entries found for that year.")
      }
      throw error
    })

    return NextResponse.json({
      book: bookRecord,
      pages,
    })
  } catch (error: any) {
    console.error("Auto-generate yearly book failed", error)
    const message = error.message || "Failed to auto-generate book"
    if (message.includes("No entries")) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

