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
    <div className="flex-1 overflow-auto bg-muted/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          {/* Page Type Labels */}
          {(pageLabel.left || pageLabel.right) && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1 flex items-center justify-center">
                {pageLabel.left && (
                  <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold shadow-sm">
                    {pageLabel.left}
                  </div>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {pageLabel.right && (
                  <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold shadow-sm">
                    {pageLabel.right}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layout Selectors - Visual Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Page Layout */}
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Left Page Layout
                </div>
                <BookLayoutSelectorVisual
                  selected={leftLayout}
                  onSelect={onLeftLayoutChange}
                  type="photo"
                />
              </div>

              {/* Right Page Layout */}
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Right Page Layout
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

