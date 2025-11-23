"use client"

import { useDraggable } from "@dnd-kit/core"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
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
  const [mounted, setMounted] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (!personId || !persons || persons.length === 0) return null
    return persons.find((p) => p.id === personId)?.display_name || null
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex flex-col h-full relative items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading quotes...</div>
      </div>
    )
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
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No quotes available</p>
                  <p className="text-xs text-muted-foreground">Add quotes from the Entries page</p>
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

