import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
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

    // Only owners can export
    if (household.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can export data" },
        { status: 403 }
      )
    }

    // Get all data for household
    const [entriesResult, personsResult, booksResult] = await Promise.all([
      supabase.from("entries").select("*").eq("household_id", household.id),
      supabase.from("persons").select("*").eq("household_id", household.id),
      supabase.from("books").select("*").eq("household_id", household.id),
    ])

    const entries = entriesResult.data || []
    const persons = personsResult.data || []
    const books = booksResult.data || []

    // Get tags and attachments
    const entryIds = entries.map((e) => e.id)
    const [tagsResult, attachmentsResult] = await Promise.all([
      entryIds.length > 0
        ? supabase.from("entry_tags").select("*").in("entry_id", entryIds)
        : { data: [], error: null },
      entryIds.length > 0
        ? supabase.from("attachments").select("*").in("entry_id", entryIds)
        : { data: [], error: null },
    ])

    const tags = tagsResult.data || []
    const attachments = attachmentsResult.data || []

    const exportData = {
      household: household,
      persons: persons,
      entries: entries,
      books: books,
      tags: tags,
      attachments: attachments,
      exported_at: new Date().toISOString(),
    }

    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sayso-export-${Date.now()}.json"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    )
  }
}

