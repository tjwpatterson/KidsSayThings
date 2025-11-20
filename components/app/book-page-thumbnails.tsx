"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookPage } from "@/lib/types"

interface BookPageThumbnailsProps {
  pages: BookPage[]
  currentPage: number
  onPageSelect: (pageNumber: number) => void
  onAddPage: () => void
}

export default function BookPageThumbnails({
  pages,
  currentPage,
  onPageSelect,
  onAddPage,
}: BookPageThumbnailsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentPageRef = useRef<HTMLButtonElement>(null)

  // Generate page numbers up to the maximum page or current page + some buffer
  const maxPage = Math.max(pages.length, currentPage, 1)
  const pageNumbers = Array.from({ length: maxPage }, (_, i) => i + 1)

  // Auto-scroll to current page when it changes
  useEffect(() => {
    if (currentPageRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const button = currentPageRef.current
      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      // Check if button is outside visible area
      if (buttonRect.left < containerRect.left) {
        // Scroll left to show the button
        container.scrollTo({
          left: container.scrollLeft + (buttonRect.left - containerRect.left) - 20,
          behavior: "smooth",
        })
      } else if (buttonRect.right > containerRect.right) {
        // Scroll right to show the button
        container.scrollTo({
          left: container.scrollLeft + (buttonRect.right - containerRect.right) + 20,
          behavior: "smooth",
        })
      }
    }
  }, [currentPage])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      })
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageSelect(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < maxPage) {
      onPageSelect(currentPage + 1)
    }
  }

  return (
    <div className="border-t bg-background flex items-center">
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollLeft}
        className="h-full rounded-none border-r shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Thumbnails Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide px-2 py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-center gap-2 min-w-max">
          {pageNumbers.map((pageNum) => {
            const page = pages.find((p) => p.page_number === pageNum)
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                ref={isActive ? currentPageRef : null}
                onClick={() => onPageSelect(pageNum)}
                className={cn(
                  "w-16 h-20 flex flex-col items-center justify-center rounded border-2 transition-all shrink-0",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium mb-1",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {pageNum}
                </span>
                {page ? (
                  <div className="w-12 h-16 bg-white rounded border border-border flex items-center justify-center text-[8px] text-muted-foreground">
                    {page.left_content?.length || 0}/{page.right_content?.length || 0}
                  </div>
                ) : (
                  <div className="w-12 h-16 bg-muted rounded border border-dashed border-muted-foreground/30" />
                )}
              </button>
            )
          })}
          <button
            onClick={onAddPage}
            className="w-16 h-20 flex items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 transition-colors shrink-0"
            title="Add Page"
          >
            <span className="text-2xl text-muted-foreground">+</span>
          </button>
        </div>
      </div>

      {/* Right Arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollRight}
        className="h-full rounded-none border-l shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Page Navigation */}
      <div className="flex items-center gap-2 px-4 border-l shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground min-w-[60px] text-center">
          {currentPage} / {maxPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= maxPage}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

