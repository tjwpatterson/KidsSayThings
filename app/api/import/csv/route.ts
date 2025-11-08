import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"

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

    const { entries } = await request.json()

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Entries array is required" },
        { status: 400 }
      )
    }

    // Get or create persons
    const personMap: Record<string, string> = {}
    const { data: existingPersons } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", household.id)

    existingPersons?.forEach((person) => {
      personMap[person.display_name.toLowerCase()] = person.id
    })

    let created = 0
    let errors = 0

    for (const entry of entries) {
      try {
        // Handle person matching/creation
        let saidBy = null
        if (entry.said_by) {
          const personName = entry.said_by.trim()
          const personKey = personName.toLowerCase()

          if (!personMap[personKey]) {
            // Create person
            const { data: newPerson, error: personError } = await supabase
              .from("persons")
              .insert({
                household_id: household.id,
                display_name: personName,
              })
              .select()
              .single()

            if (!personError && newPerson) {
              personMap[personKey] = newPerson.id
              saidBy = newPerson.id
            }
          } else {
            saidBy = personMap[personKey]
          }
        }

        // Parse date
        let entryDate = new Date().toISOString().split("T")[0]
        if (entry.date) {
          const parsedDate = new Date(entry.date)
          if (!isNaN(parsedDate.getTime())) {
            entryDate = parsedDate.toISOString().split("T")[0]
          }
        }

        // Validate entry type
        const entryType =
          entry.type === "note" || entry.type === "milestone"
            ? entry.type
            : "quote"

        // Create entry
        const { data: newEntry, error: entryError } = await supabase
          .from("entries")
          .insert({
            household_id: household.id,
            said_by: saidBy,
            captured_by: user.id,
            text: entry.text.trim(),
            entry_type: entryType,
            source: "import",
            visibility: "household",
            entry_date: entryDate,
          })
          .select()
          .single()

        if (entryError) {
          errors++
          continue
        }

        // Add tags
        if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && newEntry) {
          const tagInserts = entry.tags
            .map((tag: string) => tag.trim().toLowerCase())
            .filter((tag: string) => tag.length > 0)
            .map((tag: string) => ({
              entry_id: newEntry.id,
              tag,
            }))

          if (tagInserts.length > 0) {
            await supabase.from("entry_tags").insert(tagInserts)
          }
        }

        created++
      } catch (error) {
        errors++
      }
    }

    return NextResponse.json({
      created,
      errors,
      total: entries.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to import CSV" },
      { status: 500 }
    )
  }
}



