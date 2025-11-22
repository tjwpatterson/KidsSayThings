"use client"

import { useDraggable } from "@dnd-kit/core"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState, useRef } from "react"
import type { Entry, Person } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface BookQuoteCarouselProps {
  quotes?: Entry[]
  persons?: Person[]
}

export default function BookQuoteCarousel({
  quotes = [],
  persons = [],
}: BookQuoteCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "up" | "down") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 200
    const newPosition =
      direction === "up"
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount

    scrollContainerRef.current.scrollTop = newPosition
    setScrollPosition(newPosition)
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop)
    }
  }

  const getPersonName = (personId: string | null) => {
    if (!personId) return null
    return persons.find((p) => p.id === personId)?.display_name || null
  }

  return (
    <div className="flex flex-col h-full relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 left-1/2 -translate-x-1/2 z-10 h-6 w-8"
        onClick={() => scroll("up")}
        disabled={scrollPosition <= 0}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {quotes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No quotes available
          </div>
        ) : (
          quotes.map((quote) => (
            <DraggableQuote
              key={quote.id}
              quote={quote}
              personName={getPersonName(quote.said_by)}
            />
          ))
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-6 w-8"
        onClick={() => scroll("down")}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}

function DraggableQuote({
  quote,
  personName,
}: {
  quote: Entry
  personName: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: quote.id,
      data: {
        type: "quote",
        quote: quote,
      },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
        <p className="text-sm mb-2 line-clamp-3">{quote.text}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {personName && <span>{personName}</span>}
          <span>{format(new Date(quote.entry_date), "MMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  )
}

