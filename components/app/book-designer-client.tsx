"use client"

import dynamic from "next/dynamic"
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
import ResizableSidebar from "./resizable-sidebar"
import { createClient } from "@/lib/supabase/client"

// Dynamically import components that use Popover/Select with SSR disabled
const BookSidebarContent = dynamic(() => import("./book-sidebar-content"), {
  ssr: false,
  loading: () => <div className="flex-1 border-r bg-muted/30 flex items-center justify-center min-w-[200px]">Loading...</div>
})

const BookCanvas = dynamic(() => import("./book-canvas"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted/10 flex items-center justify-center">Loading canvas...</div>
})

type SidebarTab = "photos" | "quotes" | "theme" | "settings"

interface BookDesignerClientProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

export default function BookDesignerClient({
  book: initialBook,
  initialEntries,
  initialPersons,
  initialPages,
  initialPhotos,
}: BookDesignerClientProps) {
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
  const [zoom, setZoom] = useState(100)
  const [mounted, setMounted] = useState(false)

  // Only render after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Configure drag sensors for better drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
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
    })

    return { usedPhotoIds, usedQuoteIds }
  }

  // Get available (unused) photos and quotes
  const { usedPhotoIds, usedQuoteIds } = getUsedItemIds()
  const photos = allPhotos.filter((p) => !usedPhotoIds.has(p.id))
  const quotes = allQuotes.filter((q) => !usedQuoteIds.has(q.id))

  // Get current page data
  const currentPageData = pages.find((p) => p.page_number === currentPage)

  // Initialize current page layout
  useEffect(() => {
    if (currentPageData) {
      setLayout(currentPageData.left_layout)
    } else {
      setLayout(null)
    }
  }, [currentPageData, currentPage])

  // Update book properties
  const handleBookUpdate = useCallback(
    async (updates: Partial<Book>) => {
      setSaving(true)
      try {
        const { data, error } = await supabase
          .from("books")
          .update(updates)
          .eq("id", book.id)
          .select()
          .single()

        if (error) throw error
        setBook(data)
        toast({ title: "Book updated", description: "Changes saved." })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update book",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
    },
    [book.id, supabase, toast]
  )

  // Auto-save page function
  const savePage = useCallback(async (pageDataOverride?: { content?: PageContentItem[] }) => {
    const latestPageData = pages.find((p) => p.page_number === currentPage)

    if (!latestPageData && !layout) {
      return
    }

    setSaving(true)
    try {
      const pageData = {
        page_number: currentPage,
        left_layout: layout,
        right_layout: null,
        left_content: pageDataOverride?.content ?? latestPageData?.left_content ?? [],
        right_content: [],
      }

      const res = await fetch(`/api/books/${book.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error("Failed to save page")
      }

      const savedPage = await res.json()

      setPages((prev) => {
        const existingIndex = prev.findIndex((p) => p.page_number === currentPage)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...savedPage,
            left_layout: pageData.left_layout,
            right_layout: null,
            left_content: pageData.left_content,
            right_content: [],
          }
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

      const { data: pagesData } = await supabase
        .from("book_pages")
        .select("*")
        .eq("book_id", book.id)
        .order("page_number", { ascending: true })

      if (pagesData) {
        setPages(pagesData.map((page) => ({
          ...page,
          left_content: (page.left_content as any) || [],
          right_content: [],
        })) as BookPage[])
      }

      toast({ title: "Book generated", description: "Pages have been auto-generated." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to auto-generate book",
        variant: "destructive",
      })
    }
  }, [book.id, supabase, toast])

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

    const activeData = active.data?.current
    const isPhoto = activeData?.type === "photo" || allPhotos.some((p) => p.id === activeId)
    const isQuote = activeData?.type === "quote" || allQuotes.some((q) => q.id === activeId)

    if (!isPhoto && !isQuote) {
      return
    }

    const isTop = overId === "page-top"
    const isBottom = overId === "page-bottom"
    const isMain = overId === "page-main"

    if (!isMain && !isTop && !isBottom) return

    const targetLayout = layout

    if (isPhoto) {
      if (targetLayout === "A") {
      } else if (targetLayout === "B") {
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
      } else if (targetLayout === "B") {
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

    const contentItem: PageContentItem = {
      id: activeId,
      type: isPhoto ? "photo" : "quote",
    }

    let updatedContent: PageContentItem[] = []

    setPages((prev) => {
      const existing = prev.find((p) => p.page_number === currentPage)
      if (existing) {
        const updated = { ...existing }
        const content = updated.left_content || []

        if (targetLayout === "A") {
          updated.left_content = [contentItem]
          updatedContent = [contentItem]
        } else if (targetLayout === "B") {
          const newContent = [...content]

          if (isPhoto && isTop) {
            const existingPhotoIndex = newContent.findIndex((c) => c.type === "photo")
            if (existingPhotoIndex >= 0) {
              newContent[existingPhotoIndex] = contentItem
            } else {
              newContent.unshift(contentItem)
            }
          } else if (isQuote && isBottom) {
            const existingQuoteIndex = newContent.findIndex((c) => c.type === "quote")
            if (existingQuoteIndex >= 0) {
              newContent[existingQuoteIndex] = contentItem
            } else {
              newContent.push(contentItem)
            }
          } else {
            newContent.push(contentItem)
          }
          updated.left_content = newContent
          updatedContent = newContent
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
        updatedContent = newPage.left_content || []
        return [...prev, newPage]
      }
    })

    if (saveTimeout) {
      clearTimeout(saveTimeout)
      setSaveTimeout(null)
    }

    setTimeout(() => {
      savePage({
        content: updatedContent,
      })
    }, 50)
  }

  // Photo upload/refresh handler
  const handlePhotosUploaded = async (newPhotos: BookPhoto[]) => {
    try {
      const res = await fetch(`/api/books/${book.id}/photos`)
      if (res.ok) {
        const allPhotosData = await res.json()
        setAllPhotos(allPhotosData || [])
      } else {
        if (newPhotos.length > 0) {
          setAllPhotos((prev) => [...newPhotos, ...prev])
        }
      }
    } catch (error) {
      console.error("Error reloading photos:", error)
      if (newPhotos.length > 0) {
        setAllPhotos((prev) => [...newPhotos, ...prev])
      }
    }
    if (newPhotos.length > 0) {
      toast({
        title: "Photos uploaded",
        description: `${newPhotos.length} photo(s) added`,
      })
    }
  }

  // Remove item from page
  const handleRemoveItem = (itemId: string) => {
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

      savePage({
        content: updated.left_content,
      }).catch((error) => {
        console.error("Failed to save after removing item:", error)
      })

      return newPages
    })
  }

  // Handle page reordering
  const handlePageReorder = useCallback(async (reorderedPages: BookPage[]) => {
    setPages(reorderedPages)

    try {
      const tempOffset = 10000

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

      toast({ title: "Pages reordered", description: "Page order saved successfully." })
    } catch (error: any) {
      console.error("Failed to reorder pages:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reorder pages",
        variant: "destructive",
      })
      setPages(prev => [...prev].sort((a, b) => a.page_number - b.page_number))
    }
  }, [book.id, toast])

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
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
            />
          </ResizableSidebar>

          {/* Center Canvas */}
          <div className="flex-1 overflow-auto relative" style={{ zoom: `${zoom}%` }}>
            <BookCanvas
              book={book}
              currentPage={currentPageData}
              layout={layout}
              photos={allPhotos}
              quotes={allQuotes}
              persons={initialPersons}
              totalPages={Math.max(pages.length, currentPage, 1)}
              pages={pages}
              onLayoutChange={handleLayoutChange}
              onRemoveItem={handleRemoveItem}
              onPageSelect={setCurrentPage}
              onAddPage={async () => {
                const newPageNumber = Math.max(pages.length, currentPage, 1) + 1
                try {
                  const pageData = {
                    book_id: book.id,
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
                        right_content: [],
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
              onPageReorder={handlePageReorder}
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

