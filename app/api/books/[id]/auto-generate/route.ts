"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import { regenerateBookFromEntries } from "@/lib/books/auto-generate"

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

    const dateStart = book.date_start
    const dateEnd = book.date_end

    if (!dateStart || !dateEnd) {
      return NextResponse.json(
        { error: "Book is missing a date range." },
        { status: 400 }
      )
    }

    const { pages } = await regenerateBookFromEntries({
      supabase,
      bookId: book.id,
      householdId: household.id,
      dateStart,
      dateEnd,
    }).catch((error) => {
      if (error?.message?.includes("No entries")) {
        throw new Error("No entries found for that date range.")
      }
      throw error
    })

    const { data: updatedBook, error: updateError } = await supabase
      .from("books")
      .update({
        design_mode: "auto",
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      book: updatedBook,
      pages,
    })
  } catch (error: any) {
    console.error("Auto-generate error", error)
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

