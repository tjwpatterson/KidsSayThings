import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"
import type { BookPage, PageContentItem } from "@/lib/types"

export async function GET(
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

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    // Fetch all pages for this book
    const { data: pages, error: pagesError } = await supabase
      .from("book_pages")
      .select("*")
      .eq("book_id", id)
      .order("page_number", { ascending: true })

    if (pagesError) throw pagesError

    // Parse JSONB content fields
    const formattedPages = pages?.map((page) => ({
      ...page,
      left_content: (page.left_content as any) || [],
      right_content: (page.right_content as any) || [],
    }))

    return NextResponse.json(formattedPages || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch pages" },
      { status: 500 }
    )
  }
}

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

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      page_number,
      left_layout,
      right_layout,
      left_content = [],
      right_content = [],
    } = body

    if (page_number === undefined || page_number === null) {
      return NextResponse.json(
        { error: "Page number is required" },
        { status: 400 }
      )
    }

    // Check if page already exists
    const { data: existingPage } = await supabase
      .from("book_pages")
      .select("id")
      .eq("book_id", id)
      .eq("page_number", page_number)
      .single()

    if (existingPage) {
      // Update existing page
      const { data: page, error: updateError } = await supabase
        .from("book_pages")
        .update({
          left_layout: left_layout || null,
          right_layout: right_layout || null,
          left_content: left_content as any,
          right_content: right_content as any,
        })
        .eq("id", existingPage.id)
        .select()
        .single()

      if (updateError) throw updateError
      return NextResponse.json({
        ...page,
        left_content: (page.left_content as any) || [],
        right_content: (page.right_content as any) || [],
      })
    } else {
      // Create new page
      const { data: page, error: insertError } = await supabase
        .from("book_pages")
        .insert({
          book_id: id,
          page_number,
          left_layout: left_layout || null,
          right_layout: right_layout || null,
          left_content: left_content as any,
          right_content: right_content as any,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return NextResponse.json({
        ...page,
        left_content: (page.left_content as any) || [],
        right_content: (page.right_content as any) || [],
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save page" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const { page_id, page_number, left_layout, right_layout, left_content, right_content } = body

    if (!page_id) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      )
    }

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (page_number !== undefined) updateData.page_number = page_number
    if (left_layout !== undefined) updateData.left_layout = left_layout || null
    if (right_layout !== undefined) updateData.right_layout = right_layout || null
    if (left_content !== undefined) updateData.left_content = left_content as any
    if (right_content !== undefined) updateData.right_content = right_content as any

    const { data: page, error: updateError } = await supabase
      .from("book_pages")
      .update(updateData)
      .eq("id", page_id)
      .eq("book_id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      ...page,
      left_content: (page.left_content as any) || [],
      right_content: (page.right_content as any) || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update page" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get("page_id")

    if (!pageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      )
    }

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from("book_pages")
      .delete()
      .eq("id", pageId)
      .eq("book_id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete page" },
      { status: 500 }
    )
  }
}

