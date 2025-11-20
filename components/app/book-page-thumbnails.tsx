"use client"

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
  // Generate page numbers up to the maximum page or current page + some buffer
  const maxPage = Math.max(pages.length, currentPage, 1)
  const pageNumbers = Array.from({ length: maxPage }, (_, i) => i + 1)

  return (
    <div className="border-t bg-background px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {pageNumbers.map((pageNum) => {
          const page = pages.find((p) => p.page_number === pageNum)
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={cn(
                "w-16 h-20 flex flex-col items-center justify-center rounded border-2 transition-all shrink-0",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/50 hover:border-primary/50"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium mb-1",
                  isActive ? "text-primary" : "text-muted-foreground"
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
  )
}

