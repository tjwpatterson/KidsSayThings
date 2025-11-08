"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { PersonChip } from "@/components/app/person-chip"
import { TagChip } from "@/components/app/tag-chip"
import type { Entry, Person } from "@/lib/types"

interface EntriesFeedProps {
  householdId: string
}

export default function EntriesFeed({ householdId }: EntriesFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [persons, setPersons] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEntries()
  }, [householdId])

  const loadEntries = async () => {
    try {
      // Load entries
      const { data: entriesData, error: entriesError } = await supabase
        .from("entries")
        .select("*")
        .eq("household_id", householdId)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50)

      if (entriesError) throw entriesError

      // Load persons for this household
      const { data: personsData, error: personsError } = await supabase
        .from("persons")
        .select("*")
        .eq("household_id", householdId)

      if (personsError) throw personsError

      const personsMap: Record<string, Person> = {}
      personsData?.forEach((person) => {
        personsMap[person.id] = person
      })
      setPersons(personsMap)

      // Load tags for entries
      if (entriesData && entriesData.length > 0) {
        const entryIds = entriesData.map((e) => e.id)
        const { data: tagsData } = await supabase
          .from("entry_tags")
          .select("*")
          .in("entry_id", entryIds)

        // Attach tags to entries
        const entriesWithTags = entriesData.map((entry) => ({
          ...entry,
          tags: tagsData?.filter((t) => t.entry_id === entry.id).map((t) => t.tag) || [],
        }))

        setEntries(entriesWithTags as any)
      } else {
        setEntries([])
      }
    } catch (error: any) {
      console.error("Error loading entries:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No entries yet.</p>
        <p className="text-sm text-muted-foreground">
          Start capturing quotes and memories above!
        </p>
      </div>
    )
  }

  // Group entries by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const grouped: Record<string, typeof entries> = {
    today: [],
    thisWeek: [],
    earlier: [],
  }

  entries.forEach((entry) => {
    const entryDate = new Date(entry.entry_date)
    entryDate.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - entryDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 0) {
      grouped.today.push(entry)
    } else if (diffDays <= 7) {
      grouped.thisWeek.push(entry)
    } else {
      grouped.earlier.push(entry)
    }
  })

  return (
    <div className="space-y-8">
      {grouped.today.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Today</h2>
          <div className="space-y-4">
            {grouped.today.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                person={entry.said_by ? persons[entry.said_by] : null}
              />
            ))}
          </div>
        </div>
      )}

      {grouped.thisWeek.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">This Week</h2>
          <div className="space-y-4">
            {grouped.thisWeek.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                person={entry.said_by ? persons[entry.said_by] : null}
              />
            ))}
          </div>
        </div>
      )}

      {grouped.earlier.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Earlier</h2>
          <div className="space-y-4">
            {grouped.earlier.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                person={entry.said_by ? persons[entry.said_by] : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EntryCard({
  entry,
  person,
}: {
  entry: Entry & { tags?: string[] }
  person: Person | null
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className="text-lg leading-relaxed flex-1">{entry.text}</p>
            <Badge variant="outline" className="shrink-0">
              {entry.entry_type}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {person && <PersonChip person={person} />}
            {entry.tags && entry.tags.length > 0 && (
              <>
                {entry.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </>
            )}
            <span className="ml-auto">
              {format(new Date(entry.entry_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



