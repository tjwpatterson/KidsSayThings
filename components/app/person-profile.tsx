"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { TagChip } from "@/components/app/tag-chip"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Person, Entry } from "@/lib/types"

interface PersonProfileProps {
  person: Person
  householdId: string
}

export default function PersonProfile({
  person,
  householdId,
}: PersonProfileProps) {
  const [entries, setEntries] = useState<(Entry & { tags?: string[] })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEntries()
  }, [person.id, householdId])

  const loadEntries = async () => {
    try {
      const { data: entriesData, error: entriesError } = await supabase
        .from("entries")
        .select("*")
        .eq("household_id", householdId)
        .eq("said_by", person.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })

      if (entriesError) throw entriesError

      if (entriesData && entriesData.length > 0) {
        const entryIds = entriesData.map((e) => e.id)
        const { data: tagsData } = await supabase
          .from("entry_tags")
          .select("*")
          .in("entry_id", entryIds)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/people">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-16 w-16">
          <AvatarImage src={person.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {person.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-serif font-bold">{person.display_name}</h1>
          {person.birthdate && (
            <p className="text-muted-foreground">
              Born {format(new Date(person.birthdate), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No entries yet for {person.display_name}.
          </p>
          <p className="text-sm text-muted-foreground">
            Start capturing their quotes and memories!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {entries.length} {entries.length === 1 ? "Entry" : "Entries"}
          </h2>
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-lg leading-relaxed flex-1">{entry.text}</p>
                    <Badge variant="outline" className="shrink-0">
                      {entry.entry_type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
          ))}
        </div>
      )}
    </div>
  )
}



