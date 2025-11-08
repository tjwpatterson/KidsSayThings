"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Image, Mic, X } from "lucide-react"
import type { Person } from "@/lib/types"

interface QuickAddCardProps {
  householdId: string
}

export default function QuickAddCard({ householdId }: QuickAddCardProps) {
  const [text, setText] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<string>("")
  const [tags, setTags] = useState<string>("")
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPersons, setLoadingPersons] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadPersons()
  }, [householdId])

  const loadPersons = async () => {
    try {
      const { data, error } = await supabase
        .from("persons")
        .select("*")
        .eq("household_id", householdId)
        .order("display_name")

      if (error) throw error
      setPersons(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load people",
        variant: "destructive",
      })
    } finally {
      setLoadingPersons(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a quote or note",
        variant: "destructive",
      })
      return
    }

    if (text.length > 500) {
      toast({
        title: "Error",
        description: "Entry must be 500 characters or less",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Parse tags
      const tagArray = tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)

      // Create entry
      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert({
          household_id: householdId,
          said_by: selectedPerson || null,
          captured_by: user.id,
          text: text.trim(),
          entry_type: "quote",
          source: "app",
          visibility: "household",
        })
        .select()
        .single()

      if (entryError) throw entryError

      // Add tags
      if (tagArray.length > 0 && entry) {
        const tagInserts = tagArray.map((tag) => ({
          entry_id: entry.id,
          tag,
        }))

        const { error: tagError } = await supabase
          .from("entry_tags")
          .insert(tagInserts)

        if (tagError) throw tagError
      }

      toast({
        title: "Entry added!",
        description: "Your quote has been saved.",
      })

      // Reset form
      setText("")
      setSelectedPerson("")
      setTags("")

      // Refresh the page to show new entry
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create entry",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">What did they say?</Label>
            <Textarea
              id="text"
              placeholder="Enter the quote or memory here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={loading}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {text.length}/500
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="person">Who said it?</Label>
              <Select
                value={selectedPerson}
                onValueChange={setSelectedPerson}
                disabled={loading || loadingPersons}
              >
                <SelectTrigger id="person">
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No one specific</SelectItem>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="funny, sweet, milestone"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading}
                title="Add photo (coming soon)"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading}
                title="Add audio (coming soon)"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            <Button type="submit" disabled={loading || !text.trim()}>
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



