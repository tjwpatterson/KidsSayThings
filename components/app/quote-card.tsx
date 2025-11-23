"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getPersonColor } from "@/lib/utils"
import type { Entry, Person } from "@/lib/types"

interface QuoteCardProps {
  entry: Entry
  person: Person | null
  index?: number
}

export default function QuoteCard({ entry, person, index = 0 }: QuoteCardProps) {
  const personColor = person ? getPersonColor(person.id) : undefined

  return (
    <Card 
      className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:scale-[1.01]"
      style={{
        borderLeftColor: personColor || "transparent",
        borderLeftWidth: personColor ? "4px" : "0",
      }}
    >
      <CardContent className="pt-6 pb-5">
        <div className="space-y-4">
          <p className="text-base leading-relaxed font-medium text-foreground">{entry.text}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm pt-2 border-t border-border/50">
            {person && (
              <Badge
                variant="secondary"
                className="font-medium px-2.5 py-1"
                style={{
                  backgroundColor: `${personColor}15`,
                  color: personColor,
                  borderColor: `${personColor}30`,
                  borderWidth: "1px",
                }}
              >
                {person.display_name}
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {format(new Date(entry.entry_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

