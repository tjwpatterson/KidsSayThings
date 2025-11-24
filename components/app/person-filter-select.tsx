"use client"

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
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-muted-foreground">
        Filter by person
      </label>
      <div className="relative">
        <select
          value={selectedPersonFilter || "all"}
          onChange={(event) => {
            try {
              onPersonFilterChange(event.target.value)
            } catch (error) {
              console.error("Error changing person filter:", error)
            }
          }}
          className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All People</option>
          {persons && persons.length > 0
            ? persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name}
                </option>
              ))
            : null}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          ▾
        </span>
      </div>
    </div>
  )
}

