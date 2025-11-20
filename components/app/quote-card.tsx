"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TagChip } from "@/components/app/tag-chip"
import { format } from "date-fns"
import { getPersonColor } from "@/lib/utils"
import type { Entry, Person } from "@/lib/types"
import { motion } from "framer-motion"

interface QuoteCardProps {
  entry: Entry & { tags?: string[] }
  person: Person | null
  index?: number
}

export default function QuoteCard({ entry, person, index = 0 }: QuoteCardProps) {
  const personColor = person ? getPersonColor(person.id) : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4"
        style={{
          borderLeftColor: personColor || "transparent",
        }}
      >
        <CardContent className="pt-6">
          <div className="space-y-3">
            <p className="text-base leading-relaxed">{entry.text}</p>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {person && (
                <Badge
                  variant="secondary"
                  className="font-normal"
                  style={{
                    backgroundColor: `${personColor}20`,
                    color: personColor,
                    borderColor: `${personColor}40`,
                  }}
                >
                  {person.display_name}
                </Badge>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <>
                  {entry.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                </>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(entry.entry_date), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

