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
    <div className="bg-background border rounded-lg flex items-center h-28 shadow-sm backdrop-blur-sm">
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollLeft}
        className="h-full rounded-none border-r shrink-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Thumbnails Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide px-3 py-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-center gap-3 min-w-max">
          {pageNumbers.map((pageNum) => {
            const page = pages.find((p) => p.page_number === pageNum)
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                ref={isActive ? currentPageRef : null}
                onClick={() => onPageSelect(pageNum)}
                className={cn(
                  "w-24 h-28 flex flex-col items-center justify-center rounded-lg border-2 transition-all shrink-0 cursor-pointer",
                  isActive
                    ? "border-primary bg-primary/10 shadow-lg scale-105 ring-2 ring-primary/20"
                    : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted hover:scale-102 hover:shadow-md"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold mb-2",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {pageNum === 1 ? "Cover" : pageNum === maxPage ? "Back" : pageNum}
                </span>
                {page ? (
                  <div className="w-16 h-20 bg-white rounded-md border border-border flex flex-col items-center justify-center text-[8px] text-muted-foreground shadow-sm overflow-hidden">
                    <div className="text-[7px] font-semibold opacity-80 mb-1 text-center px-1">
                      {pageNum === 1 && "Front"}
                      {pageNum === 2 && "Title"}
                      {pageNum === maxPage && "Back"}
                    </div>
                    <div className="text-[9px] font-medium">
                      {page.left_content?.length || 0} item{page.left_content?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-20 bg-muted/50 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center">
                    <span className="text-[7px] text-muted-foreground font-medium">
                      {pageNum === 1 && "Cover"}
                      {pageNum === maxPage && "Back"}
                      {pageNum !== 1 && pageNum !== maxPage && "Empty"}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
          <button
            onClick={onAddPage}
            className="w-24 h-28 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all shrink-0 group cursor-pointer"
            title="Add New Page"
          >
            <span className="text-3xl text-primary mb-1 group-hover:scale-110 transition-transform">+</span>
            <span className="text-[10px] font-semibold text-primary">Add Page</span>
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
        <ChevronRight className="h-5 w-5" />
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
        <span className="text-sm font-medium min-w-[60px] text-center">
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

