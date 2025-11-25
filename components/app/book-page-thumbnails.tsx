"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BookPage, BookPhoto, Entry, Person, PageLayout } from "@/lib/types"
import PageThumbnailPreview from "./page-thumbnail-preview"

interface BookPageThumbnailsProps {
  pages: BookPage[]
  currentPage: number
  onPageSelect: (pageNumber: number) => void
  onAddPage: () => void
  onPageReorder?: (reorderedPages: BookPage[]) => void
  photos?: BookPhoto[]
  quotes?: Entry[]
  persons?: Person[]
  layout?: PageLayout | null
}

export default function BookPageThumbnails({
  pages,
  currentPage,
  onPageSelect,
  onAddPage,
  onPageReorder,
  photos = [],
  quotes = [],
  persons = [],
  layout = null,
}: BookPageThumbnailsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentPageRef = useRef<HTMLButtonElement>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [localPages, setLocalPages] = useState<BookPage[]>(pages)

  // Sync local pages when pages prop changes
  useEffect(() => {
    setLocalPages(pages)
  }, [pages])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id && onPageReorder) {
      setLocalPages((items) => {
        const oldIndex = items.findIndex((item) => item.page_number === active.id)
        const newIndex = items.findIndex((item) => item.page_number === over.id)

        if (oldIndex === -1 || newIndex === -1) return items

        const reordered = arrayMove(items, oldIndex, newIndex)
        
        // Update page numbers to match new order
        const updated = reordered.map((page, index) => ({
          ...page,
          page_number: index + 1,
        }))

        // Call the reorder callback
        onPageReorder(updated)
        return updated
      })
    }
  }

  // Use localPages for rendering
  const maxPage = Math.max(localPages.length, currentPage, 1)
  const pageNumbers = Array.from({ length: maxPage }, (_, i) => i + 1)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="bg-background/95 backdrop-blur-sm border-2 border-border/50 rounded-xl flex items-center h-32 shadow-lg">
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
        <SortableContext
          items={pageNumbers}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-3 min-w-max">
            {pageNumbers.map((pageNum) => {
              const page = localPages.find((p) => p.page_number === pageNum)
              const isActive = pageNum === currentPage

              return (
                <SortableThumbnail
                  key={pageNum}
                  pageNum={pageNum}
                  page={page}
                  isActive={isActive}
                  maxPage={maxPage}
                  currentPageRef={isActive ? currentPageRef : null}
                  onPageSelect={onPageSelect}
                  photos={photos}
                  quotes={quotes}
                  persons={persons}
                  layout={layout}
                />
              )
            })}
            <button
              onClick={onAddPage}
              className="w-28 h-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-primary/10 hover:border-primary hover:bg-primary/20 transition-all shrink-0 group cursor-pointer hover:scale-105 hover:shadow-lg"
              title="Add New Page"
            >
              <span className="text-3xl text-primary mb-1 group-hover:scale-110 transition-transform">+</span>
              <span className="text-[10px] font-semibold text-primary">Add Page</span>
            </button>
          </div>
        </SortableContext>
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

      <DragOverlay>
        {activeId ? (
          <div className="w-28 h-32 flex flex-col items-center justify-center rounded-xl border-2 border-primary bg-primary/15 shadow-xl scale-110 ring-4 ring-primary/30 opacity-90">
            <span className="text-xs font-semibold mb-2 text-primary">
              {activeId === 1 ? "Cover" : activeId === maxPage ? "Back" : activeId}
            </span>
            <div className="w-16 h-20 bg-white rounded-md border border-border shadow-sm" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function SortableThumbnail({
  pageNum,
  page,
  isActive,
  maxPage,
  currentPageRef,
  onPageSelect,
  photos,
  quotes,
  persons,
  layout,
}: {
  pageNum: number
  page: BookPage | undefined
  isActive: boolean
  maxPage: number
  currentPageRef: React.RefObject<HTMLButtonElement> | null
  onPageSelect: (pageNumber: number) => void
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  layout: PageLayout | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pageNum, disabled: !page })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Combine refs for both sortable and auto-scroll
  const combinedRef = (node: HTMLButtonElement | null) => {
    setNodeRef(node)
    if (currentPageRef && isActive) {
      (currentPageRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  return (
    <button
      ref={combinedRef}
      onClick={() => onPageSelect(pageNum)}
      style={style}
      className={cn(
        "w-28 h-32 flex flex-col items-center justify-center rounded-xl border-2 transition-all shrink-0 cursor-pointer",
        isActive
          ? "border-primary bg-primary/15 shadow-xl scale-110 ring-4 ring-primary/30"
          : "border-border/50 bg-muted/30 hover:border-primary/60 hover:bg-muted/50 hover:scale-105 hover:shadow-lg",
        isDragging && "opacity-50 z-50"
      )}
      {...(page ? { ...attributes, ...listeners } : {})}
    >
      <span
        className={cn(
          "text-xs font-semibold mb-1",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {pageNum === 1 ? "Cover" : pageNum === maxPage ? "Back" : pageNum}
      </span>
      {page ? (
        <div className="w-20 h-24 rounded-md border border-border shadow-sm overflow-hidden bg-white">
          <PageThumbnailPreview
            page={page}
            layout={page.left_layout || layout}
            photos={photos}
            quotes={quotes}
            persons={persons}
            width={80}
            height={96}
          />
        </div>
      ) : (
        <div className="w-20 h-24 bg-muted/50 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center">
          <span className="text-[7px] text-muted-foreground font-medium">
            {pageNum === 1 && "Cover"}
            {pageNum === maxPage && "Back"}
            {pageNum !== 1 && pageNum !== maxPage && "Empty"}
          </span>
        </div>
      )}
    </button>
  )
}

