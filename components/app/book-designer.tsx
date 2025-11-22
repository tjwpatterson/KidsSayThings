"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
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
import BookToolbar from "./book-toolbar"
import BookLeftSidebar from "./book-left-sidebar"
import BookSidebarContent from "./book-sidebar-content"
import BookCanvas from "./book-canvas"
import BookPageThumbnails from "./book-page-thumbnails"
import ResizableSidebar from "./resizable-sidebar"
import { createClient } from "@/lib/supabase/client"

type SidebarTab = "photos" | "quotes" | "layouts" | "theme" | "settings"

interface BookDesignerProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

export default function BookDesigner({
  book: initialBook,
  initialEntries,
  initialPersons,
  initialPages,
  initialPhotos,
}: BookDesignerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // State management
  const [book, setBook] = useState<Book>(initialBook)
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState<BookPage[]>(initialPages)
  const [allPhotos, setAllPhotos] = useState<BookPhoto[]>(initialPhotos)
  const [allQuotes, setAllQuotes] = useState<Entry[]>(initialEntries)
  const [leftLayout, setLeftLayout] = useState<PageLayout | null>(null)
  const [rightLayout, setRightLayout] = useState<PageLayout | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("photos")
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("all")
  const [zoom, setZoom] = useState(100) // Zoom percentage (100 = 100%)

  // Configure drag sensors for better drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch
        tolerance: 5,
      },
    })
  )

  // Initialize current page when pages change
  useEffect(() => {
    if (pages.length > 0 && currentPage > pages.length) {
      setCurrentPage(pages.length)
    } else if (pages.length === 0) {
      setCurrentPage(1)
    }
  }, [pages.length, currentPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault()
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault()
        const maxPage = Math.max(pages.length, currentPage, 1)
        if (currentPage < maxPage) {
          setCurrentPage(currentPage + 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, pages.length])

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

  // Update book properties
  const handleBookUpdate = useCallback(async (updates: Partial<Book>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error("Failed to update book")

      const updatedBook = await res.json()
      setBook(updatedBook)
    } catch (error: any) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [book.id, toast])

  // Auto-save page function
  const savePage = useCallback(async (pageDataOverride?: { left_content?: PageContentItem[], right_content?: PageContentItem[] }) => {
    // Get the latest page data from state
    const latestPageData = pages.find((p) => p.page_number === currentPage)
    
    if (!latestPageData && !leftLayout && !rightLayout) {
      return // Don't save empty pages
    }

    setSaving(true)
    try {
      const pageData = {
        page_number: currentPage,
        left_layout: leftLayout,
        right_layout: rightLayout,
        left_content: pageDataOverride?.left_content ?? latestPageData?.left_content ?? [],
        right_content: pageDataOverride?.right_content ?? latestPageData?.right_content ?? [],
      }

      console.log("Saving page:", pageData)

      const res = await fetch(`/api/books/${book.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Save failed:", errorText)
        throw new Error("Failed to save page")
      }

      const savedPage = await res.json()
      console.log("Page saved successfully:", savedPage)
      console.log("Saved page content:", {
        left: savedPage.left_content,
        right: savedPage.right_content,
        expectedLeft: pageData.left_content,
        expectedRight: pageData.right_content,
      })

      // Update local state with saved page - use the content we sent, not what came back (in case API has issues)
      setPages((prev) => {
        const existingIndex = prev.findIndex((p) => p.page_number === currentPage)
        if (existingIndex >= 0) {
          const updated = [...prev]
          // Use the content we sent to the API, not what came back (defensive)
          updated[existingIndex] = {
            ...savedPage,
            left_content: pageData.left_content, // Use what we sent
            right_content: pageData.right_content, // Use what we sent
          }
          console.log("Updated page state:", updated[existingIndex])
          return updated
        }
        return [...prev, {
          ...savedPage,
          left_content: pageData.left_content,
          right_content: pageData.right_content,
        }]
      })
    } catch (error: any) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: error.message || "Failed to save page changes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [currentPage, leftLayout, rightLayout, pages, book.id, toast])

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

  // Auto-generate book
  const handleAutoGenerate = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to generate book")
      }

      // Reload pages after generation
      const { data: pagesData } = await supabase
        .from("book_pages")
        .select("*")
        .eq("book_id", book.id)
        .order("page_number", { ascending: true })

      if (pagesData) {
        setPages(pagesData.map((page) => ({
          ...page,
          left_content: (page.left_content as any) || [],
          right_content: (page.right_content as any) || [],
        })) as BookPage[])
      }
    } catch (error: any) {
      throw error
    }
  }, [book.id, supabase])

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

    // Determine if dragging photo or quote from data or by ID lookup
    const activeData = active.data?.current
    const isPhoto = activeData?.type === "photo" || allPhotos.some((p) => p.id === activeId)
    const isQuote = activeData?.type === "quote" || allQuotes.some((q) => q.id === activeId)

    if (!isPhoto && !isQuote) {
      console.log("Drag end: Not a photo or quote", { activeId, activeData, allPhotos: allPhotos.length, allQuotes: allQuotes.length })
      return
    }

    // Determine target page side and position
    const isLeftPage = overId.includes("left-")
    const isRightPage = overId.includes("right-")
    const isTop = overId.includes("-top")
    const isBottom = overId.includes("-bottom")

    if (!isLeftPage && !isRightPage) return

    const targetSide = isLeftPage ? "left" : "right"
    const targetLayout = targetSide === "left" ? leftLayout : rightLayout

    // Check layout constraints
    if (isPhoto) {
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

    // Calculate updated content before state update to pass to savePage
    let updatedLeftContent: PageContentItem[] = []
    let updatedRightContent: PageContentItem[] = []

    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (existing) {
        const updated = { ...existing }
        const content = targetSide === "left" ? updated.left_content : updated.right_content

        if (targetLayout === "A") {
          if (targetSide === "left") {
            updated.left_content = [contentItem]
            updatedLeftContent = [contentItem]
            updatedRightContent = updated.right_content || []
          } else {
            updated.right_content = [contentItem]
            updatedLeftContent = updated.left_content || []
            updatedRightContent = [contentItem]
          }
        } else if (targetLayout === "B") {
          const newContent = [...(content || [])]
          if (isTop) {
            newContent[0] = contentItem
          } else if (isBottom) {
            newContent[1] = contentItem
          } else {
            newContent.push(contentItem)
          }
          if (targetSide === "left") {
            updated.left_content = newContent
            updatedLeftContent = newContent
            updatedRightContent = updated.right_content || []
          } else {
            updated.right_content = newContent
            updatedLeftContent = updated.left_content || []
            updatedRightContent = newContent
          }
        } else if (targetLayout === "C") {
          const newContent = [...(content || [])]
          if (isTop) {
            const topIndex = newContent.findIndex((c) => c.type === "photo") >= 0
              ? newContent.findIndex((c) => c.type === "photo")
              : 0
            newContent[topIndex] = contentItem
          } else if (isBottom) {
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
            updatedLeftContent = newContent
            updatedRightContent = updated.right_content || []
          } else {
            updated.right_content = newContent
            updatedLeftContent = updated.left_content || []
            updatedRightContent = newContent
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
        updatedLeftContent = newPage.left_content || []
        updatedRightContent = newPage.right_content || []
        return [...prev, newPage]
      }
    })

    // Save immediately with the updated content to prevent disappearing
    // Use a shorter timeout and clear any pending auto-save
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      setSaveTimeout(null)
    }
    
    setTimeout(() => {
      console.log("Saving drag result:", { updatedLeftContent, updatedRightContent, currentPage })
      savePage({
        left_content: updatedLeftContent,
        right_content: updatedRightContent,
      })
    }, 50)
  }

  // Photo upload/refresh handler
  const handlePhotosUploaded = async (newPhotos: BookPhoto[]) => {
    console.log("Photos updated:", newPhotos)
    // Reload all photos from server to ensure we have the latest
    try {
      const res = await fetch(`/api/books/${book.id}/photos`)
      if (res.ok) {
        const allPhotosData = await res.json()
        console.log("Reloaded photos from server:", allPhotosData)
        setAllPhotos(allPhotosData || [])
      } else {
        // Fallback: if newPhotos provided, use them; otherwise keep current
        if (newPhotos.length > 0) {
          setAllPhotos((prev) => [...newPhotos, ...prev])
        }
      }
    } catch (error) {
      console.error("Error reloading photos:", error)
      // Fallback: if newPhotos provided, use them; otherwise keep current
      if (newPhotos.length > 0) {
        setAllPhotos((prev) => [...newPhotos, ...prev])
      }
    }
    // Only show toast if new photos were actually uploaded
    if (newPhotos.length > 0) {
      toast({
        title: "Photos uploaded",
        description: `${newPhotos.length} photo(s) added`,
      })
    }
  }

  // Remove item from page
  const handleRemoveItem = (side: "left" | "right", itemId: string) => {
    // Clear any pending auto-save to prevent overwriting
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      setSaveTimeout(null)
    }

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

      const newPages = prev.map((p) => (p.page_number === currentPage ? updated : p))
      
      // Save immediately with the updated content
      const pageData = {
        page_number: currentPage,
        left_layout: leftLayout,
        right_layout: rightLayout,
        left_content: updated.left_content,
        right_content: updated.right_content,
      }
      
      // Save immediately without delay
      savePage({
        left_content: updated.left_content,
        right_content: updated.right_content,
      }).catch((error) => {
        console.error("Failed to save after removing item:", error)
      })
      
      return newPages
    })
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
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Top Toolbar */}
        <BookToolbar
          book={book}
          onUpdate={handleBookUpdate}
          onAutoGenerate={handleAutoGenerate}
          saving={saving}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Icon Menu */}
          <BookLeftSidebar
            activeTab={activeSidebarTab}
            onTabChange={setActiveSidebarTab}
          />

          {/* Sidebar Content Panel - Resizable */}
          <ResizableSidebar defaultWidth={320} minWidth={200} maxWidth={600}>
            <BookSidebarContent
              activeTab={activeSidebarTab}
              quotes={quotes}
              photos={photos}
              persons={initialPersons}
              book={book}
              bookId={book.id}
              selectedPersonFilter={selectedPersonFilter}
              onPersonFilterChange={setSelectedPersonFilter}
              onPhotosUploaded={handlePhotosUploaded}
              onBookUpdate={handleBookUpdate}
              leftLayout={leftLayout}
              rightLayout={rightLayout}
              onLeftLayoutChange={setLeftLayout}
              onRightLayoutChange={setRightLayout}
            />
          </ResizableSidebar>

          {/* Center Canvas */}
          <div className="flex-1 overflow-auto relative" style={{ zoom: `${zoom}%` }}>
            <BookCanvas
              book={book}
              currentPage={currentPageData}
              leftLayout={leftLayout}
              rightLayout={rightLayout}
              photos={allPhotos}
              quotes={allQuotes}
              persons={initialPersons}
              totalPages={Math.max(pages.length, currentPage, 1)}
              onLeftLayoutChange={setLeftLayout}
              onRightLayoutChange={setRightLayout}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>

        {/* Bottom Bar - Page Thumbnails */}
        <BookPageThumbnails
          pages={pages}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
          onAddPage={async () => {
            const newPageNumber = Math.max(pages.length, currentPage, 1) + 1
            // Create the new page immediately
            try {
              const pageData = {
                page_number: newPageNumber,
                left_layout: null,
                right_layout: null,
                left_content: [],
                right_content: [],
              }
              
              const res = await fetch(`/api/books/${book.id}/pages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pageData),
              })
              
              if (res.ok) {
                const newPage = await res.json()
                setPages((prev) => [
                  ...prev,
                  {
                    ...newPage,
                    left_content: (newPage.left_content as any) || [],
                    right_content: (newPage.right_content as any) || [],
                  },
                ])
                setCurrentPage(newPageNumber)
              } else {
                throw new Error("Failed to create page")
              }
            } catch (error) {
              console.error("Failed to create new page:", error)
              toast({
                title: "Error",
                description: "Failed to create new page",
                variant: "destructive",
              })
            }
          }}
        />
      </div>

      {/* Drag Overlay */}
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
