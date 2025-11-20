"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Send, Image, Mic } from "lucide-react"
import type { Person } from "@/lib/types"
import { motion } from "framer-motion"

interface QuickAddCardProps {
  householdId: string
  selectedPersonId: string | null
  onPersonSelect: (personId: string | null) => void
  onEntryAdded?: () => void
}

export default function QuickAddCard({
  householdId,
  selectedPersonId,
  onPersonSelect,
  onEntryAdded,
}: QuickAddCardProps) {
  const [text, setText] = useState("")
  const [tags, setTags] = useState("")
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPersons, setLoadingPersons] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadPersons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        description: "Please enter a quote",
        variant: "destructive",
      })
      return
    }

    if (!selectedPersonId) {
      toast({
        title: "Error",
        description: "Please select who said this quote",
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
          said_by: selectedPersonId,
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
        title: "Quote added!",
        description: "Your quote has been saved.",
      })

      // Reset form
      setText("")
      setTags("")

      // Refresh entries
      if (onEntryAdded) {
        onEntryAdded()
      } else {
        window.location.reload()
      }
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

  const canSubmit = text.trim().length > 0 && selectedPersonId !== null && !loading

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b pb-6 mb-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Person selector - ChatGPT style */}
        <div className="space-y-2">
          <Label htmlFor="person" className="text-sm font-medium">
            Who said this?
          </Label>
          <Select
            value={selectedPersonId || ""}
            onValueChange={(value) => onPersonSelect(value || null)}
            disabled={loading || loadingPersons}
            required
          >
            <SelectTrigger id="person" className="w-full">
              <SelectValue placeholder="Select a person (required)" />
            </SelectTrigger>
            <SelectContent>
              {persons.length === 0 ? (
                <SelectItem value="" disabled>
                  No people added yet
                </SelectItem>
              ) : (
                persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.display_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!selectedPersonId && (
            <p className="text-xs text-muted-foreground">
              You must select a person to save this quote
            </p>
          )}
        </div>

        {/* Quote input - ChatGPT style */}
        <div className="space-y-2">
          <Label htmlFor="text" className="text-sm font-medium">
            What did they say?
          </Label>
          <div className="relative">
            <Textarea
              id="text"
              placeholder="Enter the quote here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={loading}
              className="resize-none pr-12"
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {text.length}/500
            </div>
          </div>
        </div>

        {/* Tags - optional */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium text-muted-foreground">
            Tags (optional)
          </Label>
          <Input
            id="tags"
            placeholder="funny, sweet, milestone"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Saving..." : "Save Quote"}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}



