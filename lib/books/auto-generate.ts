import type { Entry } from "@/lib/types"
import { SupabaseClient } from "@supabase/supabase-js"

interface AutoGenerateOptions {
  supabase: SupabaseClient
  bookId: string
  householdId: string
  dateStart: string
  dateEnd: string
}

interface AutoGenerateResult {
  entries: Entry[]
  pages: any[]
}

export async function regenerateBookFromEntries({
  supabase,
  bookId,
  householdId,
  dateStart,
  dateEnd,
}: AutoGenerateOptions): Promise<AutoGenerateResult> {
  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, entry_date, text, said_by")
    .eq("household_id", householdId)
    .gte("entry_date", dateStart)
    .lte("entry_date", dateEnd)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true })

  if (entriesError) {
    throw entriesError
  }

  if (!entries || entries.length === 0) {
    throw new Error("No entries found for that date range.")
  }

  // Reset existing content
  await supabase.from("book_pages").delete().eq("book_id", bookId)
  await supabase.from("book_entries").delete().eq("book_id", bookId)

  const pagesPayload = [
    {
      book_id: bookId,
      page_number: 1,
      left_layout: null,
      right_layout: null,
      left_content: [],
      right_content: [],
    },
    ...entries.map((entry, index) => ({
      book_id: bookId,
      page_number: index + 2,
      left_layout: "A",
      right_layout: null,
      left_content: [
        {
          id: entry.id,
          type: "quote",
        },
      ],
      right_content: [],
    })),
  ]

  await supabase.from("book_pages").insert(pagesPayload)

  const bookEntryRows = entries.map((entry, index) => ({
    book_id: bookId,
    entry_id: entry.id,
    position: index + 1,
  }))

  if (bookEntryRows.length > 0) {
    await supabase.from("book_entries").insert(bookEntryRows)
  }

  const { data: pages, error: pagesError } = await supabase
    .from("book_pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true })

  if (pagesError) {
    throw pagesError
  }

  return {
    entries: entries as Entry[],
    pages: pages || [],
  }
}

