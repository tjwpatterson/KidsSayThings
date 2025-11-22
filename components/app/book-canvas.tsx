"use client"

import BookPagePreview from "./book-page-preview"
import BookLayoutSelectorVisual from "./book-layout-selector-visual"
import type { Book, BookPage, Entry, Person, BookPhoto, PageLayout } from "@/lib/types"

interface BookCanvasProps {
  book: Book
  currentPage: BookPage | undefined
  leftLayout: PageLayout | null
  rightLayout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  totalPages: number
  onLeftLayoutChange: (layout: PageLayout | null) => void
  onRightLayoutChange: (layout: PageLayout | null) => void
  onRemoveItem: (side: "left" | "right", itemId: string) => void
}

export default function BookCanvas({
  book,
  currentPage,
  leftLayout,
  rightLayout,
  photos,
  quotes,
  persons,
  totalPages,
  onLeftLayoutChange,
  onRightLayoutChange,
  onRemoveItem,
}: BookCanvasProps) {
  // Determine page type labels
  const currentPageNumber = currentPage?.page_number || 1
  const getPageLabel = (pageNumber: number) => {
    if (pageNumber === 1) {
      return { left: "Front Cover", right: "Title Page" }
    }
    // Last page is back cover
    if (pageNumber === totalPages) {
      return { left: null, right: "Back Cover" }
    }
    // Page 2 could be title/intro page continuation
    if (pageNumber === 2) {
      return { left: null, right: "Intro Page" }
    }
    return { left: null, right: null }
  }

  const pageLabel = getPageLabel(currentPageNumber)

  return (
    <div className="flex-1 bg-muted/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 min-h-full">
        <div className="w-full max-w-5xl">
          {/* Compact Header with Page Labels and Layout Selectors */}
          <div className="mb-3">
            {/* Page Type Labels - Compact */}
            {(pageLabel.left || pageLabel.right) && (
              <div className="flex gap-2 mb-3 justify-center">
                {pageLabel.left && (
                  <div className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
                    {pageLabel.left}
                  </div>
                )}
                {pageLabel.right && (
                  <div className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
                    {pageLabel.right}
                  </div>
                )}
              </div>
            )}

            {/* Layout Selectors - More Compact */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left Page Layout */}
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Left Layout
                </div>
                <BookLayoutSelectorVisual
                  selected={leftLayout}
                  onSelect={onLeftLayoutChange}
                  type="photo"
                />
              </div>

              {/* Right Page Layout */}
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Right Layout
                </div>
                <BookLayoutSelectorVisual
                  selected={rightLayout}
                  onSelect={onRightLayoutChange}
                  type="quote"
                />
              </div>
            </div>
          </div>

          {/* Two-Page Spread Preview */}
          <div className="flex justify-center">
            <BookPagePreview
              book={book}
              page={currentPage}
              leftLayout={leftLayout}
              rightLayout={rightLayout}
              photos={photos}
              quotes={quotes}
              persons={persons}
              onRemoveItem={onRemoveItem}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

