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
    } = body

    if (!date_start || !date_end) {
      return NextResponse.json(
        { error: "Date range is required" },
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

    return NextResponse.json(book)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create book" },
      { status: 500 }
    )
  }
}




