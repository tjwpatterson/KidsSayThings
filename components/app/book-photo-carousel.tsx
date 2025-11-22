"use client"

import { useDraggable } from "@dnd-kit/core"
import { ChevronUp, ChevronDown, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { BookPhoto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface BookPhotoCarouselProps {
  photos: BookPhoto[]
  bookId: string
  onPhotoDeleted?: (photoId: string) => void
}

export default function BookPhotoCarousel({ photos, bookId, onPhotoDeleted }: BookPhotoCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
            <DraggablePhoto 
              key={photo.id} 
              photo={photo} 
              bookId={bookId}
              onDeleted={onPhotoDeleted}
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

function DraggablePhoto({ 
  photo, 
  bookId,
  onDeleted 
}: { 
  photo: BookPhoto
  bookId: string
  onDeleted?: (photoId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: photo.id,
      data: {
        type: "photo",
        photo: photo,
      },
    })
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (isDeleting) {
      console.log("Delete already in progress")
      return
    }
    
    console.log("Deleting photo:", {
      photoId: photo.id,
      bookId: bookId,
      filename: photo.filename,
      url: photo.url,
      fullPhoto: photo
    })
    setIsDeleting(true)
    try {
      const deleteUrl = `/api/books/${bookId}/photos?photo_id=${photo.id}`
      console.log("DELETE request to:", deleteUrl)
      
      const res = await fetch(deleteUrl, {
        method: "DELETE",
      })

      console.log("Delete response status:", res.status, res.statusText)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to delete photo" }))
        console.error("Delete error response:", errorData)
        throw new Error(errorData.error || "Failed to delete photo")
      }

      const result = await res.json().catch(() => ({}))
      console.log("Delete successful:", result)

      toast({
        title: "Photo deleted",
        description: "The photo has been removed from your book.",
      })

      onDeleted?.(photo.id)
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing relative ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow relative group">
        {/* Delete button - appears on hover, positioned outside drag area */}
        <button
          onClick={handleDelete}
          onMouseDown={(e) => {
            // Prevent drag from starting when clicking delete button
            e.stopPropagation()
          }}
          onTouchStart={(e) => {
            // Prevent drag from starting on touch devices
            e.stopPropagation()
          }}
          disabled={isDeleting}
          className="absolute top-1 right-1 z-20 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
          title="Delete photo"
        >
          <X className="h-3 w-3" />
        </button>
        
        {/* Drag handle */}
        <div {...listeners} {...attributes} className="w-full h-full">
        {photo.url ? (
          <>
            <img
              src={photo.url}
              alt={photo.filename || "Photo"}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                console.error("Failed to load photo:", {
                  url: photo.url,
                  filename: photo.filename,
                  photoId: photo.id,
                  fullPhoto: photo,
                })
                // Show error state
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                const parent = target.parentElement
                if (parent && !parent.querySelector(".photo-error")) {
                  const errorDiv = document.createElement("div")
                  errorDiv.className = "photo-error w-full aspect-square flex flex-col items-center justify-center p-2 bg-muted text-xs text-center break-words"
                  errorDiv.innerHTML = `
                    <div class="text-muted-foreground mb-1">⚠️ Image failed to load</div>
                    <div class="text-[10px] text-muted-foreground/70">${photo.filename || "Photo"}</div>
                  `
                  parent.appendChild(errorDiv)
                }
              }}
              onLoad={() => {
                console.log("Photo loaded successfully:", photo.url)
              }}
            />
            {/* Show filename overlay on hover for debugging */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 opacity-0 hover:opacity-100 transition-opacity truncate">
              {photo.filename || "Photo"}
            </div>
          </>
        ) : (
          <div className="w-full aspect-square flex flex-col items-center justify-center p-2 bg-muted text-xs text-center break-words">
            <div className="text-muted-foreground mb-1">⚠️ No URL</div>
            <div className="text-[10px]">{photo.filename || "Photo"}</div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

