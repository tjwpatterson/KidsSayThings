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

type SidebarTab = "photos" | "quotes" | "layouts" | "settings"

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
  const [pages, setPages] = useState<BookPage[]>(initialPages || [])
  const [allPhotos, setAllPhotos] = useState<BookPhoto[]>(initialPhotos || [])
  const [allQuotes, setAllQuotes] = useState<Entry[]>(initialEntries || [])
  const [layout, setLayout] = useState<PageLayout | null>(null)
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

  // Get used item IDs from all pages (using left_content for single page)
  const getUsedItemIds = () => {
    const usedPhotoIds = new Set<string>()
    const usedQuoteIds = new Set<string>()

    pages.forEach((page) => {
      page.left_content?.forEach((item) => {
        if (item.type === "photo") usedPhotoIds.add(item.id)
        else usedQuoteIds.add(item.id)
      })
    })

    return { usedPhotoIds, usedQuoteIds }
  }

  // Get available (unused) photos and quotes
  const { usedPhotoIds, usedQuoteIds } = getUsedItemIds()
  const photos = (allPhotos || []).filter((p) => !usedPhotoIds.has(p.id))
  const quotes = (allQuotes || []).filter((q) => !usedQuoteIds.has(q.id))

  // Get current page data
  const currentPageData = pages.find((p) => p.page_number === currentPage)

  // Initialize current page layout
  useEffect(() => {
    if (currentPageData) {
      setLayout(currentPageData.left_layout) // Use left_layout for single page
    } else {
      setLayout(null)
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
  const savePage = useCallback(async (pageDataOverride?: { content?: PageContentItem[] }) => {
    // Get the latest page data from state
    const latestPageData = pages.find((p) => p.page_number === currentPage)
    
    if (!latestPageData && !layout) {
      return // Don't save empty pages
    }

    setSaving(true)
    try {
      const pageData = {
        page_number: currentPage,
        left_layout: layout, // Use left_layout for single page
        right_layout: null, // Always null for single page
        left_content: pageDataOverride?.content ?? latestPageData?.left_content ?? [],
        right_content: [], // Always empty for single page
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
        content: savedPage.left_content,
        expectedContent: pageData.left_content,
      })

      // Update local state with saved page - use the content we sent, not what came back (in case API has issues)
      setPages((prev) => {
        const existingIndex = prev.findIndex((p) => p.page_number === currentPage)
        if (existingIndex >= 0) {
          const updated = [...prev]
          // Use the content we sent to the API, not what came back (defensive)
          updated[existingIndex] = {
            ...savedPage,
            left_layout: pageData.left_layout,
            right_layout: null,
            left_content: pageData.left_content, // Use what we sent
            right_content: [], // Always empty for single page
          }
          console.log("Updated page state:", updated[existingIndex])
          return updated
        }
        return [...prev, {
          ...savedPage,
          left_layout: pageData.left_layout,
          right_layout: null,
          left_content: pageData.left_content,
          right_content: [],
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
  }, [currentPage, layout, pages, book.id, toast])

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
  }, [layout, currentPage, savePage, saveTimeout, activeId])

  // Handle layout change with immediate save
  const handleLayoutChange = useCallback(async (newLayout: PageLayout | null) => {
    try {
      setLayout(newLayout)
      // Save immediately when layout changes
      const latestPageData = pages.find((p) => p.page_number === currentPage)
      if (latestPageData || newLayout) {
        const pageData = {
          page_number: currentPage,
          left_layout: newLayout,
          right_layout: null,
          left_content: latestPageData?.left_content || [],
          right_content: [],
        }
        
        const res = await fetch(`/api/books/${book.id}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pageData),
        })
        
        if (!res.ok) {
          throw new Error("Failed to save layout")
        }
      }
    } catch (error) {
      console.error("Error saving layout:", error)
      toast({
        title: "Error",
        description: "Failed to save layout change",
        variant: "destructive",
      })
    }
  }, [currentPage, pages, book.id, toast])

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

    // Determine target position (single page now)
    const isTop = overId === "page-top"
    const isBottom = overId === "page-bottom"
    const isMain = overId === "page-main"

    if (!isMain && !isTop && !isBottom) {
      console.log("Drag end: Invalid drop target", { overId, activeId })
      return
    }

    const targetLayout = layout

    // Check layout constraints for simplified layouts:
    // Layout A: Full page (photo OR quote) - accepts either
    // Layout B: Photo 2/3 + Quote 1/3 - accepts both photo and quote
    if (isPhoto) {
      if (targetLayout === "A") {
        // Layout A accepts photos
      } else if (targetLayout === "B") {
        // Layout B accepts photos (in photo area)
        if (!isTop) {
          toast({
            title: "Invalid placement",
            description: "Photo must be placed in the top area (2/3) of Layout B",
            variant: "destructive",
          })
          return
        }
      } else {
        toast({
          title: "Invalid placement",
          description: "Photo cannot be placed here with current layout",
          variant: "destructive",
        })
        return
      }
    } else if (isQuote) {
      if (targetLayout === "A") {
        // Layout A accepts quotes
      } else if (targetLayout === "B") {
        // Layout B accepts quotes (in quote area)
        if (!isBottom) {
          toast({
            title: "Invalid placement",
            description: "Quote must be placed in the bottom area (1/3) of Layout B",
            variant: "destructive",
          })
          return
        }
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
    let updatedContent: PageContentItem[] = []

    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (existing) {
        const updated = { ...existing }
        const content = updated.left_content || []

        if (targetLayout === "A") {
          // Layout A: Full page - replace with single item
            updated.left_content = [contentItem]
          updatedContent = [contentItem]
        } else if (targetLayout === "B") {
          // Layout B: Photo 2/3 + Quote 1/3
          const newContent = [...content]
          
          if (isPhoto && isTop) {
            // Replace or add photo in top position
            const existingPhotoIndex = newContent.findIndex((c) => c.type === "photo")
            if (existingPhotoIndex >= 0) {
              newContent[existingPhotoIndex] = contentItem
          } else {
              newContent.unshift(contentItem)
            }
          } else if (isQuote && isBottom) {
            // Replace or add quote in bottom position
            const existingQuoteIndex = newContent.findIndex((c) => c.type === "quote")
            if (existingQuoteIndex >= 0) {
              newContent[existingQuoteIndex] = contentItem
            } else {
              newContent.push(contentItem)
            }
          } else {
            // Fallback: add to content
            newContent.push(contentItem)
          }
          
            updated.left_content = newContent
          updatedContent = newContent
          } else {
          // No layout - just add to content
          updated.left_content = [...content, contentItem]
          updatedContent = [...content, contentItem]
        }

        return prev.map((p) => (p.page_number === currentPage ? updated : p))
      } else {
        const newPage: BookPage = {
          id: "",
          book_id: book.id,
          page_number: currentPage,
          left_layout: layout,
          right_layout: null,
          left_content: [contentItem],
          right_content: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        updatedContent = [contentItem]
        return [...prev, newPage]
      }
    })

    // Save immediately with the updated content
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      setSaveTimeout(null)
    }
    
    setTimeout(() => {
      console.log("Saving drag result:", { updatedContent, currentPage })
      savePage({
        content: updatedContent,
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
  const handleRemoveItem = (itemId: string) => {
    // Clear any pending auto-save to prevent overwriting
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      setSaveTimeout(null)
    }

    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (!existing) return prev

      const updated = { ...existing }
        updated.left_content = (updated.left_content || []).filter(
          (item) => item.id !== itemId
        )

      const newPages = prev.map((p) => (p.page_number === currentPage ? updated : p))
      
      // Save immediately without delay
      savePage({
        content: updated.left_content,
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
          onToggleManageView={() => {}}
          isManageView={false}
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
              spreadKind="interior"
              selectedPhotoCount={1}
              selectedLeftLayoutId={null}
              selectedCoverLayoutId={null}
              onPhotoCountChange={() => {}}
              onSelectLeftLayout={() => {}}
              onSelectCoverLayout={() => {}}
            />
          </ResizableSidebar>

          {/* Center Canvas */}
          <div className="flex-1 overflow-auto relative" style={{ zoom: `${zoom}%` }}>
            <BookPageThumbnails
              pages={pages}
              currentPage={currentPage}
              onPageSelect={setCurrentPage}
              photos={photos}
              quotes={quotes}
              persons={initialPersons}
              layout={null}
              onPageReorder={async (reorderedPages: BookPage[]) => {
                // Update page numbers in database
                // Use temporary high numbers first to avoid conflicts, then update to final numbers
                try {
                  const tempOffset = 10000
                  
                  // Step 1: Update all pages to temporary numbers
                  for (const page of reorderedPages) {
                    await fetch(`/api/books/${book.id}/pages`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        page_id: page.id,
                        page_number: tempOffset + page.page_number,
                      }),
                    })
                  }

                  // Step 2: Update all pages to final numbers
                  for (let i = 0; i < reorderedPages.length; i++) {
                    await fetch(`/api/books/${book.id}/pages`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        page_id: reorderedPages[i].id,
                        page_number: i + 1,
                      }),
                    })
                  }

                  // Reload pages
                  const { data: pagesData } = await supabase
                    .from("book_pages")
                    .select("*")
                    .eq("book_id", book.id)
                    .order("page_number", { ascending: true })

                  if (pagesData) {
                    const updatedPages = pagesData.map((page) => ({
                      ...page,
                      left_content: (page.left_content as any) || [],
                      right_content: [],
                    })) as BookPage[]
                    setPages(updatedPages)
                    // Update current page if it changed
                    const updatedCurrentPage = updatedPages.find((p) => p.id === currentPageData?.id)
                    if (updatedCurrentPage) {
                      setCurrentPage(updatedCurrentPage.page_number)
                    }
                  }

                  toast({
                    title: "Pages reordered",
                    description: "Page order has been saved",
                  })
                } catch (error) {
                  console.error("Failed to reorder pages:", error)
                  toast({
                    title: "Error",
                    description: "Failed to save page order",
                    variant: "destructive",
                  })
                }
              }}
              onAddPage={async () => {
                const newPageNumber = Math.max(pages.length, currentPage, 1) + 1
                // Create the new page immediately
                try {
                  const pageData = {
                    page_number: newPageNumber,
                    left_layout: null,
                    right_layout: null,
                    left_content: [],
                    right_content: [], // Always empty for single page
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
                        right_content: [], // Always empty for single page
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
        </div>
      </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeId ? (
                <div className="bg-white p-3 rounded-lg shadow-2xl border-2 border-primary/50 transform rotate-2 scale-105">
                  {allPhotos.find((p) => p.id === activeId) ? (
                    <img
                      src={allPhotos.find((p) => p.id === activeId)?.url || ""}
                      alt="Dragging"
                      className="w-40 h-40 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md flex items-center justify-center p-4 text-sm border-2 border-primary/20">
                      <p className="text-center font-medium line-clamp-3">
                        {allQuotes.find((q) => q.id === activeId)?.text || "Quote"}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
    </DndContext>
  )
}
