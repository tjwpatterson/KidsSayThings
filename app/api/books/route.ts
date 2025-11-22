import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"

export async function GET(request: Request) {
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

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch books" },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const {
      date_start,
      date_end,
      title,
      size = "6x9",
      theme = "classic",
      cover_style = "linen",
      dedication,
      page_count = 24,
    } = body

    if (!date_start || !date_end) {
      return NextResponse.json(
        { error: "Date range is required" },
        { status: 400 }
      )
    }

    // Validate page count
    if (![24, 40, 60].includes(page_count)) {
      return NextResponse.json(
        { error: "Page count must be 24, 40, or 60" },
        { status: 400 }
      )
    }

    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        household_id: household.id,
        date_start,
        date_end,
        title: title || null,
        size,
        theme,
        cover_style,
        dedication: dedication || null,
        status: "draft",
      })
      .select()
      .single()

    if (bookError) throw bookError

    // Create initial pages for the book
    // Page 1 is cover/title, so we create pages 1 through page_count
    const pagesToCreate = []
    for (let i = 1; i <= page_count; i++) {
      pagesToCreate.push({
        book_id: book.id,
        page_number: i,
        left_layout: null,
        right_layout: null,
        left_content: [],
        right_content: [],
      })
    }

    const { error: pagesError } = await supabase
      .from("book_pages")
      .insert(pagesToCreate)

    if (pagesError) {
      console.error("Error creating initial pages:", pagesError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json(book)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create book" },
      { status: 500 }
    )
  }
}





