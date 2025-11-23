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

interface PersonFilterSelectProps {
  selectedPersonFilter: string
  persons: Person[]
  onPersonFilterChange: (personId: string) => void
}

export default function PersonFilterSelect({
  selectedPersonFilter,
  persons,
  onPersonFilterChange,
}: PersonFilterSelectProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center">
        <span className="text-muted-foreground">Filter by person</span>
      </div>
    )
  }

  return (
    <Select
      value={selectedPersonFilter || "all"}
      onValueChange={(value) => {
        try {
          onPersonFilterChange(value)
        } catch (error) {
          console.error("Error changing person filter:", error)
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by person" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All People</SelectItem>
        {persons && persons.length > 0
          ? persons.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.display_name}
              </SelectItem>
            ))
          : null}
      </SelectContent>
    </Select>
  )
}

