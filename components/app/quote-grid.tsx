"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import QuoteCard from "./quote-card"
import DateRangeFilter, { type DateRange } from "./date-range-filter"
import type { Entry, Person } from "@/lib/types"

interface QuoteGridProps {
  householdId: string
  personId: string | null
}

export default function QuoteGrid({ householdId, personId }: QuoteGridProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [persons, setPersons] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })

  useEffect(() => {
    if (!personId) {
      setEntries([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    const loadEntries = async () => {
      setLoading(true)
      try {
        // Build query
        let query = supabase
          .from("entries")
          .select("*")
          .eq("household_id", householdId)
          .eq("said_by", personId)
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false })

        // Apply date range filter
        if (dateRange.start) {
          const startDate = dateRange.start.toISOString().split("T")[0]
          query = query.gte("entry_date", startDate)
        }
        if (dateRange.end) {
          const endDate = dateRange.end.toISOString().split("T")[0]
          query = query.lte("entry_date", endDate)
        }

        const { data: entriesData, error: entriesError } = await query

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

        setEntries(entriesData || [])
      } catch (error: any) {
        console.error("Error loading entries:", error)
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    householdId,
    personId,
    dateRange.start?.getTime(),
    dateRange.end?.getTime(),
  ])

  if (!personId) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <p className="text-lg font-medium text-muted-foreground mb-2">
            Select a person to view their quotes
          </p>
          <p className="text-sm text-muted-foreground">
            Choose someone from the sidebar to see their quote bank
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading quotes...</div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No quotes found
            </p>
            <p className="text-sm text-muted-foreground">
              {dateRange.start || dateRange.end
                ? "Try adjusting the date range"
                : "Start capturing quotes for this person!"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry, index) => (
          <QuoteCard
            key={entry.id}
            entry={entry}
            person={entry.said_by ? persons[entry.said_by] || null : null}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

