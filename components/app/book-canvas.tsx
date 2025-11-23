"use client"

import { useState } from "react"
import BookPagePreview from "./book-page-preview"
import BookPageThumbnails from "./book-page-thumbnails"
import BookPageOrganizer from "./book-page-organizer"
import { Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Book, BookPage, Entry, Person, BookPhoto, PageLayout } from "@/lib/types"

interface BookCanvasProps {
  book: Book
  currentPage: BookPage | undefined
  layout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  totalPages: number
  pages: BookPage[]
  onLayoutChange: (layout: PageLayout | null) => void
  onRemoveItem: (itemId: string) => void
  onPageSelect: (pageNumber: number) => void
  onAddPage: () => void
  onPageReorder: (reorderedPages: BookPage[]) => void
}

export default function BookCanvas({
  book,
  currentPage,
  layout,
  photos,
  quotes,
  persons,
  totalPages,
  pages,
  onLayoutChange,
  onRemoveItem,
  onPageSelect,
  onAddPage,
  onPageReorder,
}: BookCanvasProps) {
  const [showOrganizer, setShowOrganizer] = useState(false)
  
  // Determine page type labels
  const currentPageNumber = currentPage?.page_number || 1
  const getPageLabel = (pageNumber: number) => {
    if (pageNumber === 1) {
      return "Front Cover"
    }
    // Last page is back cover
    if (pageNumber === totalPages) {
      return "Back Cover"
    }
    // Page 2 could be title/intro page
    if (pageNumber === 2) {
      return "Title Page"
    }
    return null
  }

  const pageLabel = getPageLabel(currentPageNumber)

  return (
    <>
      <div className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-full">
          <div className="w-full max-w-6xl space-y-6">
            {/* Page Carousel - Above Page Preview */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex-1">
                <BookPageThumbnails
                  pages={pages}
                  currentPage={currentPageNumber}
                  onPageSelect={onPageSelect}
                  onAddPage={onAddPage}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOrganizer(true)}
                className="ml-4 gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Organize Pages
              </Button>
            </div>

            {/* Page Type Label */}
            {pageLabel && (
              <div className="mb-4 justify-center flex">
                <div className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
                  {pageLabel}
                </div>
              </div>
            )}

            {/* Single Page Preview */}
            <div className="flex justify-center">
              <BookPagePreview
                book={book}
                page={currentPage}
                layout={layout}
                photos={photos}
                quotes={quotes}
                persons={persons}
                onLayoutChange={onLayoutChange}
                onRemoveItem={onRemoveItem}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page Organizer Modal */}
      {showOrganizer && (
        <BookPageOrganizer
          pages={pages}
          currentPage={currentPageNumber}
          onPageSelect={onPageSelect}
          onPageReorder={onPageReorder}
          onClose={() => setShowOrganizer(false)}
        />
      )}
    </>
  )
}
