"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core"
import type {
  Book,
  Entry,
  Person,
  BookPhoto,
  BookPage,
  PageLayout,
  PageContentItem,
} from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import BookPhotoCarousel from "./book-photo-carousel"
import BookQuoteCarousel from "./book-quote-carousel"
import BookPagePreview from "./book-page-preview"
import BookLayoutSelector from "./book-layout-selector"
import BookThemeSelector from "./book-theme-selector"
import BookPageNavigation from "./book-page-navigation"
import BookPhotoUpload from "./book-photo-upload"
import { Button } from "@/components/ui/button"
import { Save, Eye, Grid, Check } from "lucide-react"

interface BookDesignerProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

export default function BookDesigner({
  book,
  initialEntries,
  initialPersons,
  initialPhotos,
}: BookDesignerProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState<BookPage[]>([])
  const [allPhotos, setAllPhotos] = useState<BookPhoto[]>(initialPhotos)
  const [allQuotes, setAllQuotes] = useState<Entry[]>(initialEntries)
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("all")
  const [selectedTheme, setSelectedTheme] = useState<string>(book.theme)
  const [leftLayout, setLeftLayout] = useState<PageLayout | null>(null)
  const [rightLayout, setRightLayout] = useState<PageLayout | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Get used item IDs from all pages
  const getUsedItemIds = () => {
    const usedPhotoIds = new Set<string>()
    const usedQuoteIds = new Set<string>()

    pages.forEach((page) => {
      page.left_content?.forEach((item) => {
        if (item.type === "photo") usedPhotoIds.add(item.id)
        else usedQuoteIds.add(item.id)
      })
      page.right_content?.forEach((item) => {
        if (item.type === "photo") usedPhotoIds.add(item.id)
        else usedQuoteIds.add(item.id)
      })
    })

    return { usedPhotoIds, usedQuoteIds }
  }

  // Get available (unused) photos and quotes
  const { usedPhotoIds, usedQuoteIds } = getUsedItemIds()
  const photos = allPhotos.filter((p) => !usedPhotoIds.has(p.id))
  const quotes = allQuotes.filter((q) => !usedQuoteIds.has(q.id))
  const filteredQuotes =
    selectedPersonFilter === "all"
      ? quotes
      : quotes.filter((q) => q.said_by === selectedPersonFilter)

  // Get current page data
  const currentPageData = pages.find((p) => p.page_number === currentPage)

  // Initialize current page layouts
  useEffect(() => {
    if (currentPageData) {
      setLeftLayout(currentPageData.left_layout)
      setRightLayout(currentPageData.right_layout)
    } else {
      setLeftLayout(null)
      setRightLayout(null)
    }
  }, [currentPageData, currentPage])

  // Update filtered quotes when filter or quotes change
  useEffect(() => {
    // Filtered quotes are now computed in the render, no need for separate state
  }, [selectedPersonFilter, quotes])

  // Auto-save function
  const savePage = useCallback(async () => {
    if (!currentPageData && !leftLayout && !rightLayout) {
      return // Don't save empty pages
    }

    setSaving(true)
    try {
      const pageData = {
        page_number: currentPage,
        left_layout: leftLayout,
        right_layout: rightLayout,
        left_content: currentPageData?.left_content || [],
        right_content: currentPageData?.right_content || [],
      }

      const res = await fetch(`/api/books/${book.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      })

      if (!res.ok) {
        throw new Error("Failed to save page")
      }

      const savedPage = await res.json()

      // Update local state
      setPages((prev) => {
        const existing = prev.findIndex((p) => p.page_number === currentPage)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = savedPage
          return updated
        }
        return [...prev, savedPage]
      })
    } catch (error: any) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save page",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [currentPage, leftLayout, rightLayout, currentPageData, book.id, toast])

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(() => {
      savePage()
    }, 2000)

    setSaveTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [leftLayout, rightLayout, currentPage, savePage])

  // Drag handlers
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine if dragging photo or quote (check against all items, not just unused)
    const isPhoto = allPhotos.some((p) => p.id === activeId)
    const isQuote = allQuotes.some((q) => q.id === activeId)

    if (!isPhoto && !isQuote) return

    // Determine target page side and position
    const isLeftPage = overId.includes("left-")
    const isRightPage = overId.includes("right-")
    const isTop = overId.includes("-top")
    const isBottom = overId.includes("-bottom")
    const isMain = overId.includes("-main") || (!isTop && !isBottom)

    if (!isLeftPage && !isRightPage) return

    const targetSide = isLeftPage ? "left" : "right"
    const targetLayout = targetSide === "left" ? leftLayout : rightLayout

    // Check layout constraints
    if (isPhoto) {
      // Photos can go to left page (A, B) or right page (C)
      if (isLeftPage && targetLayout && targetLayout !== "C") {
        // Valid
      } else if (isRightPage && targetLayout === "C") {
        // Valid
      } else {
        toast({
          title: "Invalid placement",
          description: "Photo cannot be placed here with current layout",
          variant: "destructive",
        })
        return
      }
    } else if (isQuote) {
      // Quotes can go to right page (A, B) or left page (C)
      if (isRightPage && targetLayout && targetLayout !== "C") {
        // Valid
      } else if (isLeftPage && targetLayout === "C") {
        // Valid
      } else {
        toast({
          title: "Invalid placement",
          description: "Quote cannot be placed here with current layout",
          variant: "destructive",
        })
        return
      }
    }

    // Add to page content
    const contentItem: PageContentItem = {
      id: activeId,
      type: isPhoto ? "photo" : "quote",
    }

    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (existing) {
        const updated = { ...existing }
        const content = targetSide === "left" ? updated.left_content : updated.right_content

        // For layout A, replace if exists, otherwise add
        // For layout B/C, add to appropriate position
        if (targetLayout === "A") {
          // Replace single item
          if (targetSide === "left") {
            updated.left_content = [contentItem]
          } else {
            updated.right_content = [contentItem]
          }
        } else if (targetLayout === "B") {
          // Add to top or bottom position
          const newContent = [...(content || [])]
          if (isTop) {
            newContent[0] = contentItem
          } else if (isBottom) {
            newContent[1] = contentItem
          } else {
            // Default to adding at end
            newContent.push(contentItem)
          }
          if (targetSide === "left") {
            updated.left_content = newContent
          } else {
            updated.right_content = newContent
          }
        } else if (targetLayout === "C") {
          // Add to top or bottom position
          const newContent = [...(content || [])]
          if (isTop) {
            // Find and replace top item (photo preferred) or add
            const topIndex = newContent.findIndex((c) => c.type === "photo") >= 0
              ? newContent.findIndex((c) => c.type === "photo")
              : 0
            newContent[topIndex] = contentItem
          } else if (isBottom) {
            // Find and replace bottom item (quote preferred) or add
            const bottomIndex = newContent.findIndex((c) => c.type === "quote") >= 0
              ? newContent.findIndex((c) => c.type === "quote")
              : newContent.length
            if (bottomIndex < newContent.length) {
              newContent[bottomIndex] = contentItem
            } else {
              newContent.push(contentItem)
            }
          } else {
            newContent.push(contentItem)
          }
          if (targetSide === "left") {
            updated.left_content = newContent
          } else {
            updated.right_content = newContent
          }
        }

        return prev.map((p) => (p.page_number === currentPage ? updated : p))
      } else {
        const newPage: BookPage = {
          id: "",
          book_id: book.id,
          page_number: currentPage,
          left_layout: leftLayout,
          right_layout: rightLayout,
          left_content: targetSide === "left" ? [contentItem] : [],
          right_content: targetSide === "right" ? [contentItem] : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return [...prev, newPage]
      }
    })

    // Trigger save
    setTimeout(() => savePage(), 100)
  }

  // Photo upload handler
  const handlePhotosUploaded = (newPhotos: BookPhoto[]) => {
    setAllPhotos((prev) => [...newPhotos, ...prev])
    setIsUploadModalOpen(false)
    toast({
      title: "Photos uploaded",
      description: `${newPhotos.length} photo(s) added`,
    })
  }

  // Remove item from page and restore to carousel
  const handleRemoveItem = (side: "left" | "right", itemId: string) => {
    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (!existing) return prev

      const updated = { ...existing }
      if (side === "left") {
        updated.left_content = (updated.left_content || []).filter(
          (item) => item.id !== itemId
        )
      } else {
        updated.right_content = (updated.right_content || []).filter(
          (item) => item.id !== itemId
        )
      }

      return prev.map((p) => (p.page_number === currentPage ? updated : p))
    })

    // Find the item to restore
    const removedItem = pages
      .find((p) => p.page_number === currentPage)
      ?.left_content?.find((item) => item.id === itemId) ||
      pages
        .find((p) => p.page_number === currentPage)
        ?.right_content?.find((item) => item.id === itemId)

    if (removedItem) {
      if (removedItem.type === "photo") {
        // Photo will be restored automatically when removed from usedPhotoIds
      } else {
        // Quote will be restored automatically when removed from usedQuoteIds
      }
    }

    // Trigger save
    setTimeout(() => savePage(), 100)
  }

  // Finalize book
  const handleFinalize = async () => {
    if (pages.length < 20) {
      toast({
        title: "Minimum pages required",
        description: "Books must have at least 20 pages",
        variant: "destructive",
      })
      return
    }

    if (pages.length > 80) {
      toast({
        title: "Maximum pages exceeded",
        description: "Books can have at most 80 pages",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ready",
          design_mode: "manual",
        }),
      })

      if (!res.ok) throw new Error("Failed to finalize book")

      toast({
        title: "Book finalized",
        description: "Your book is ready for PDF generation",
      })

      router.push(`/app/books/${book.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to finalize book",
        variant: "destructive",
      })
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Top ribbon - Theme selector */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <BookThemeSelector
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
              />
            </div>
            <div className="flex gap-2">
              {saving && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Save className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              )}
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Grid className="h-4 w-4 mr-2" />
                Arrange Pages
              </Button>
              <Button onClick={handleFinalize} size="sm">
                <Check className="h-4 w-4 mr-2" />
                Finalize
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Photo carousel */}
          <div className="w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Photos</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload
                </Button>
              </div>
            </div>
            <BookPhotoCarousel photos={photos} />
          </div>

          {/* Center - Two-page spread preview */}
          <div className="flex-1 overflow-auto p-8 bg-muted/10">
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-4 mb-6">
                {/* Left page layout selector */}
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium">Left Page Layout</div>
                  <BookLayoutSelector
                    selected={leftLayout}
                    onSelect={setLeftLayout}
                    type="photo"
                  />
                </div>
                {/* Right page layout selector */}
                <div className="flex-1">
                  <div className="mb-2 text-sm font-medium">Right Page Layout</div>
                  <BookLayoutSelector
                    selected={rightLayout}
                    onSelect={setRightLayout}
                    type="quote"
                  />
                </div>
              </div>

              <BookPagePreview
                book={book}
                page={currentPageData}
                leftLayout={leftLayout}
                rightLayout={rightLayout}
                photos={allPhotos}
                quotes={allQuotes}
                persons={initialPersons}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          </div>

          {/* Right sidebar - Quote carousel */}
          <div className="w-64 border-l bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Quotes</h3>
              </div>
              <select
                value={selectedPersonFilter}
                onChange={(e) => setSelectedPersonFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                <option value="all">All People</option>
                {initialPersons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name}
                  </option>
                ))}
              </select>
            </div>
            <BookQuoteCarousel quotes={filteredQuotes} persons={initialPersons} />
          </div>
        </div>

        {/* Bottom - Page navigation */}
        <div className="border-t bg-background p-4">
          <BookPageNavigation
            currentPage={currentPage}
            totalPages={pages.length || 1}
            onPageChange={setCurrentPage}
            onAddPage={() => setCurrentPage((pages.length || 0) + 1)}
          />
        </div>
      </div>

      {/* Photo upload modal */}
      <BookPhotoUpload
        bookId={book.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handlePhotosUploaded}
      />

      <DragOverlay>
        {activeId ? (
          <div className="bg-white p-2 rounded shadow-lg border">
            {allPhotos.find((p) => p.id === activeId) ? (
              <img
                src={allPhotos.find((p) => p.id === activeId)?.url || ""}
                alt="Dragging"
                className="w-32 h-32 object-cover rounded"
              />
            ) : (
              <div className="w-32 h-32 bg-muted rounded flex items-center justify-center p-2 text-sm">
                {allQuotes.find((q) => q.id === activeId)?.text || "Quote"}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

