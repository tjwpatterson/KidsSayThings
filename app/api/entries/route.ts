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

    const { searchParams } = new URL(request.url)
    const personId = searchParams.get("personId")
    const tag = searchParams.get("tag")
    const q = searchParams.get("q")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 50
    const offset = (page - 1) * limit

    let query = supabase
      .from("entries")
      .select("*", { count: "exact" })
      .eq("household_id", household.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (personId) {
      query = query.eq("said_by", personId)
    }

    if (from) {
      query = query.gte("entry_date", from)
    }

    if (to) {
      query = query.lte("entry_date", to)
    }

    if (q) {
      query = query.ilike("text", `%${q}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    // If tag filter, need to join with entry_tags
    let filteredData = data
    if (tag && data) {
      const { data: tagData } = await supabase
        .from("entry_tags")
        .select("entry_id")
        .eq("tag", tag.toLowerCase())

      const tagEntryIds = new Set(tagData?.map((t) => t.entry_id) || [])
      filteredData = data.filter((entry) => tagEntryIds.has(entry.id))
    }

    return NextResponse.json({
      data: filteredData,
      count: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch entries" },
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
      text,
      said_by,
      entry_type = "quote",
      entry_date,
      tags = [],
      visibility = "household",
    } = body

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Text must be 500 characters or less" },
        { status: 400 }
      )
    }

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .insert({
        household_id: household.id,
        said_by: said_by || null,
        captured_by: user.id,
        text: text.trim(),
        entry_type,
        source: "app",
        visibility,
        entry_date: entry_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (entryError) throw entryError

    // Add tags
    if (tags.length > 0 && entry) {
      const tagInserts = tags
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0)
        .map((tag: string) => ({
          entry_id: entry.id,
          tag,
        }))

      if (tagInserts.length > 0) {
        const { error: tagError } = await supabase
          .from("entry_tags")
          .insert(tagInserts)

        if (tagError) throw tagError
      }
    }

    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create entry" },
      { status: 500 }
    )
  }
}




