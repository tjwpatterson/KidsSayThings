"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookPage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BookPageOrganizerProps {
  pages: BookPage[]
  currentPage: number
  onPageSelect: (pageNumber: number) => void
  onPageReorder: (reorderedPages: BookPage[]) => void
  onClose: () => void
}

export default function BookPageOrganizer({
  pages,
  currentPage,
  onPageSelect,
  onPageReorder,
  onClose,
}: BookPageOrganizerProps) {
  const [localPages, setLocalPages] = useState<BookPage[]>(pages)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalPages((items) => {
        const oldIndex = items.findIndex((item) => item.page_number === active.id)
        const newIndex = items.findIndex((item) => item.page_number === over.id)

        const reordered = arrayMove(items, oldIndex, newIndex)
        
        // Update page numbers to match new order
        const updated = reordered.map((page, index) => ({
          ...page,
          page_number: index + 1,
        }))

        return updated
      })
    }
  }

  const handleSave = () => {
    // Update page numbers in database
    onPageReorder(localPages)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organize Pages</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drag pages to reorder them. Click a page to view it.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localPages.map((p) => p.page_number)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {localPages.map((page) => (
                  <SortablePageThumbnail
                    key={page.id}
                    page={page}
                    isActive={page.page_number === currentPage}
                    onClick={() => {
                      onPageSelect(page.page_number)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Order
          </Button>
        </div>
      </div>
    </div>
  )
}

function SortablePageThumbnail({
  page,
  isActive,
  onClick,
}: {
  page: BookPage
  isActive: boolean
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.page_number })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasContent =
    (page.left_content && (page.left_content as any[]).length > 0) ||
    (page.left_layout !== null)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group cursor-pointer",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div
        onClick={onClick}
        className={cn(
          "aspect-[2/3] bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center p-2",
          isActive
            ? "border-primary shadow-lg scale-105"
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Page number */}
        <div className="absolute top-1 left-1 bg-background/80 px-1.5 py-0.5 rounded text-xs font-medium">
          {page.page_number}
        </div>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Page preview */}
        {hasContent ? (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            {page.left_layout === "A" && "Full Page"}
            {page.left_layout === "B" && "Photo + Quote"}
            {(page.left_content as any[])?.length > 0 && (
              <div className="text-[10px] mt-1">
                {(page.left_content as any[]).length} item(s)
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground">
            Empty
          </div>
        )}
      </div>
    </div>
  )
}

