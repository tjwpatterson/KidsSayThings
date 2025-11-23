"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Person } from "@/lib/types"

interface PersonSelectProps {
  selectedPersonId: string | null
  persons: Person[]
  onPersonSelect: (personId: string | null) => void
  disabled?: boolean
  required?: boolean
  id?: string
}

export default function PersonSelect({
  selectedPersonId,
  persons,
  onPersonSelect,
  disabled = false,
  required = false,
  id,
}: PersonSelectProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center">
        <span className="text-muted-foreground">Select a person...</span>
      </div>
    )
  }

  return (
    <Select
      value={selectedPersonId || ""}
      onValueChange={(value) => onPersonSelect(value || null)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select a person (required)" />
      </SelectTrigger>
      <SelectContent>
        {persons.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No people added yet
          </div>
        ) : (
          persons.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.display_name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

