"use client"

import { useDraggable } from "@dnd-kit/core"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { BookPhoto } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface BookPhotoCarouselProps {
  photos: BookPhoto[]
}

export default function BookPhotoCarousel({ photos }: BookPhotoCarouselProps) {
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
        {photos.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No photos available
          </div>
        ) : (
          photos.map((photo) => (
            <DraggablePhoto key={photo.id} photo={photo} />
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

function DraggablePhoto({ photo }: { photo: BookPhoto }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: photo.id,
      data: {
        type: "photo",
        photo: photo,
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
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.filename || "Photo"}
            className="w-full aspect-square object-cover"
            onError={(e) => {
              console.error("Failed to load photo:", photo.url, photo)
              // Fallback: show filename if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              if (target.parentElement) {
                const fallback = document.createElement("div")
                fallback.className = "w-full aspect-square flex items-center justify-center p-2 bg-muted text-xs text-center break-words"
                fallback.textContent = photo.filename || "Photo"
                target.parentElement.appendChild(fallback)
              }
            }}
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center p-2 bg-muted text-xs text-center break-words">
            {photo.filename || "Photo"}
          </div>
        )}
      </div>
    </div>
  )
}

