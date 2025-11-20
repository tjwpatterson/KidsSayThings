"use client"

import BookPagePreview from "./book-page-preview"
import BookLayoutSelector from "./book-layout-selector"
import type { Book, BookPage, Entry, Person, BookPhoto, PageLayout } from "@/lib/types"

interface BookCanvasProps {
  book: Book
  currentPage: BookPage | undefined
  leftLayout: PageLayout | null
  rightLayout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
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
  onLeftLayoutChange,
  onRightLayoutChange,
  onRemoveItem,
}: BookCanvasProps) {
  return (
    <div className="flex-1 overflow-auto p-8 bg-muted/10">
      <div className="max-w-5xl mx-auto">
        {/* Layout Selectors */}
        <div className="flex gap-4 mb-6">
          {/* Left Page Layout */}
          <div className="flex-1">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Left Page Layout
            </div>
            <BookLayoutSelector
              selected={leftLayout}
              onSelect={onLeftLayoutChange}
              type="photo"
            />
          </div>

          {/* Right Page Layout */}
          <div className="flex-1">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Right Page Layout
            </div>
            <BookLayoutSelector
              selected={rightLayout}
              onSelect={onRightLayoutChange}
              type="quote"
            />
          </div>
        </div>

        {/* Two-Page Spread Preview */}
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
  )
}

