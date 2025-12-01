"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import type {
  Book,
  Entry,
  Person,
  BookPhoto,
  BookPage,
  PageContentItem,
  Layout,
  SpreadKind,
  LayoutSlot,
} from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_INTERIOR_PHOTO_LAYOUT_ID,
  DEFAULT_INTERIOR_QUOTE_LAYOUT_ID,
  LAYOUTS_BY_ID,
  getQuoteLayoutIdForCount,
} from "@/lib/books/layouts"
import { autoAssignEntriesToSlots, autoAssignPhotosToSlots } from "@/lib/books/layout-helpers"

// Dynamically import ALL components to prevent any SSR
const BookToolbar = dynamic(() => import("./book-toolbar"), { ssr: false })
const BookLeftSidebar = dynamic(() => import("./book-left-sidebar"), { ssr: false })
const ResizableSidebar = dynamic(() => import("./resizable-sidebar"), { ssr: false })

// Dynamically import components that use Popover/Select with SSR disabled
const BookSidebarContent = dynamic(() => import("./book-sidebar-content"), {
  ssr: false,
  loading: () => <div className="flex-1 border-r bg-muted/30 flex items-center justify-center min-w-[200px]">Loading...</div>
})

// BookCanvas uses LayoutSelectorButton which uses Popover, so disable SSR
const BookCanvas = dynamic(() => import("./book-canvas"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted/10 flex items-center justify-center">Loading canvas...</div>
})
const BookManagePages = dynamic(() => import("./book-manage-pages"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted/10 flex items-center justify-center">Loading pages...</div>
})

type SidebarTab = "photos" | "quotes" | "layouts" | "settings"

interface BookDesignerClientProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

const buildSlotDroppableId = (spread: BookPage, spreadIndex: number, slotId: string) => {
  const spreadKey = spread.id && spread.id.length > 0 ? spread.id : `spread-${spreadIndex}`
  return `${spreadKey}-${slotId}`
}

const getSpreadKind = (index: number): SpreadKind => (index === 0 ? "cover" : "interior")

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
  const [pages, setPages] = useState<BookPage[]>(() => initialPages || [])
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0)
  const [allPhotos, setAllPhotos] = useState<BookPhoto[]>(initialPhotos || [])
  const [allQuotes, setAllQuotes] = useState<Entry[]>(initialEntries || [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("photos")
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("all")
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(1)
  const [viewMode, setViewMode] = useState<"edit" | "manage">("edit")
  const [zoom, setZoom] = useState(100)
  const [clientReady, setClientReady] = useState(false)
  const pendingSpreadRef = useRef<BookPage | null>(null)
  const scrollToSpreadRef = useRef<(index: number) => void>(() => {})

  // Set clientReady after mount - must be called unconditionally
  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientReady(true)
    }
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

  useEffect(() => {
    if (pages.length === 0) {
      setActiveSpreadIndex(0)
      return
    }

    if (activeSpreadIndex >= pages.length) {
      setActiveSpreadIndex(Math.max(pages.length - 1, 0))
    }
  }, [pages.length, activeSpreadIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const maxIndex = Math.max(pages.length - 1, 0)

      if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault()
        setActiveSpreadIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          if (next !== prev) {
            scrollToSpreadRef.current(next)
          }
          return next
        })
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault()
        setActiveSpreadIndex((prev) => {
          const next = Math.min(prev + 1, maxIndex)
          if (next !== prev) {
            scrollToSpreadRef.current(next)
          }
          return next
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pages.length])

  // Get used item IDs from all pages
  const getUsedItemIds = () => {
    const usedPhotoIds = new Set<string>()
    const usedQuoteIds = new Set<string>()

    pages.forEach((page) => {
      ;(page.left_content || []).forEach((item) => {
        if (item.type === "photo") usedPhotoIds.add(item.id)
        else usedQuoteIds.add(item.id)
      })
      ;(page.right_content || []).forEach((item) => {
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

  const buildPhotoPool = useCallback(
    (spread?: BookPage) => {
      if (!spread) return photos
      const currentAssignments =
        [...(spread.left_content || []), ...(spread.right_content || [])]
          ?.filter((item) => item.type === "photo")
          .map((item) => allPhotos.find((photo) => photo.id === item.id))
          .filter((item): item is BookPhoto => Boolean(item)) || []

      const merged = [...currentAssignments, ...photos]
      const seen = new Set<string>()
      return merged.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    },
    [allPhotos, photos]
  )

  const buildQuotePool = useCallback(
    (spread?: BookPage) => {
      if (!spread) return quotes
      const currentAssignments =
        spread.right_content
          ?.filter((item) => item.type === "quote")
          .map((item) => allQuotes.find((quote) => quote.id === item.id))
          .filter((item): item is Entry => Boolean(item)) || []

      const merged = [...currentAssignments, ...quotes]
      const seen = new Set<string>()
      return merged.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    },
    [allQuotes, quotes]
  )

  const spreadKinds = useMemo(
    () => pages.map((_, index) => getSpreadKind(index)),
    [pages]
  )

  const activeSpread = pages[activeSpreadIndex]
  const activeSpreadKind: SpreadKind =
    spreadKinds[activeSpreadIndex] ?? getSpreadKind(activeSpreadIndex)

  const activeLeftLayout: Layout | null =
    activeSpread?.left_layout && LAYOUTS_BY_ID[activeSpread.left_layout]
      ? LAYOUTS_BY_ID[activeSpread.left_layout]
      : null

  const selectedPhotoLayoutId =
    activeSpreadKind === "interior" ? activeSpread?.left_layout ?? null : null
  const selectedCoverLayoutId =
    activeSpreadKind === "cover" ? activeSpread?.left_layout ?? null : null

  useEffect(() => {
    if (activeLeftLayout?.photoCount) {
      setSelectedPhotoCount(activeLeftLayout.photoCount)
    } else if (!activeSpread) {
      setSelectedPhotoCount(1)
    }
  }, [activeSpread, activeLeftLayout?.photoCount])

  const getSpreadLabel = useCallback(
    (spread: BookPage, index: number) => {
      if (index === 0) return "Front Cover / Inside Cover"
      const spreadNumber = spread.page_number || index + 1
      const leftNumber = spreadNumber * 2 - 1
      const rightNumber = leftNumber + 1
      return `Pages ${leftNumber}–${rightNumber}`
    },
    []
  )

  const spreadLabels = useMemo(
    () => pages.map((spread, index) => getSpreadLabel(spread, index)),
    [pages, getSpreadLabel]
  )

  const slotMap = useMemo(() => {
    const map = new Map<
      string,
      {
        slot: LayoutSlot
        spreadIndex: number
      }
    >()

    pages.forEach((spread, spreadIndex) => {
      const kind = spreadKinds[spreadIndex] ?? getSpreadKind(spreadIndex)
      const leftSource = spread.left_layout ? LAYOUTS_BY_ID[spread.left_layout] || null : null
      const rightSource =
        kind === "cover"
          ? spread.right_layout
            ? LAYOUTS_BY_ID[spread.right_layout] || null
            : leftSource
          : spread.right_layout
          ? LAYOUTS_BY_ID[spread.right_layout] || null
          : null

      if (leftSource) {
        leftSource.slots
          .filter((slot) => slot.pageSide === "left")
          .forEach((slot) => {
            map.set(buildSlotDroppableId(spread, spreadIndex, slot.id), { slot, spreadIndex })
          })
      }

      if (rightSource) {
        rightSource.slots
          .filter((slot) => slot.pageSide === "right")
          .forEach((slot) => {
            map.set(buildSlotDroppableId(spread, spreadIndex, slot.id), { slot, spreadIndex })
          })
      }
    })

    return map
  }, [pages, spreadKinds])

  // Update book properties
  const persistSpread = useCallback(
    async (spread: BookPage) => {
      setSaving(true)
      try {
        const payload = {
          page_number: spread.page_number,
          left_layout: spread.left_layout,
          right_layout: spread.right_layout,
          left_content: spread.left_content || [],
          right_content: spread.right_content || [],
        }

        const res = await fetch(`/api/books/${book.id}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error("Failed to save spread")
        }
      } catch (error: any) {
        toast({
          title: "Save failed",
          description: error.message || "Failed to save changes",
          variant: "destructive",
        })
      } finally {
        pendingSpreadRef.current = null
        setSaving(false)
      }
    },
    [book.id, toast]
  )

  const scheduleSave = useCallback(
    (spread: BookPage) => {
      pendingSpreadRef.current = spread
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      const timeout = setTimeout(() => {
        if (pendingSpreadRef.current) {
          persistSpread(pendingSpreadRef.current)
        }
      }, 1200)

      setSaveTimeout(timeout)
    },
    [persistSpread, saveTimeout]
  )

  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  const updateSpreadAtIndex = useCallback(
    (spreadIndex: number, mutator: (spread: BookPage) => BookPage) => {
      setPages((prev) => {
        if (!prev[spreadIndex]) return prev

        const next = [...prev]
        const base = next[spreadIndex]
        const draft: BookPage = {
          ...base,
          left_content: [...(base.left_content || [])],
          right_content: [...(base.right_content || [])],
        }

        const updated = mutator(draft)
        next[spreadIndex] = updated
        scheduleSave(updated)
        return next
      })
    },
    [scheduleSave]
  )

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

  // Debounced auto-save will be driven by updateSpreadAtIndex -> scheduleSave

  const handleSelectPhotoLayout = useCallback(
    (layoutId: string) => {
      const layoutDef = LAYOUTS_BY_ID[layoutId]
      if (!layoutDef) return
      const targetIndex = activeSpreadIndex
      const targetSpread = pages[targetIndex]
      if (!targetSpread) return

      setSelectedPhotoCount(layoutDef.photoCount || 1)
      const targetKind = targetSpread.kind ?? getSpreadKind(targetIndex)
      const isCover = targetKind === "cover"

      updateSpreadAtIndex(targetIndex, (spread) => {
        const combinedExisting = [
          ...(spread.left_content || []),
          ...(spread.right_content || []),
        ]

        const assignedPhotos = autoAssignPhotosToSlots({
          layout: layoutDef,
          existingContent: combinedExisting,
          availablePhotos: buildPhotoPool(spread),
        })

        const leftPhotos = assignedPhotos.filter((item) => item.pageSide !== "right")
        const rightPhotos = assignedPhotos.filter((item) => item.pageSide === "right")

        if (isCover) {
          return {
            ...spread,
            left_layout: layoutId,
            right_layout: layoutId,
            left_content: leftPhotos,
            right_content: rightPhotos,
          }
        }

        const quoteLayoutId =
          layoutDef.pairedQuoteLayoutId ||
          getQuoteLayoutIdForCount(layoutDef.quoteCount || layoutDef.photoCount || 1)
        const quoteLayout = LAYOUTS_BY_ID[quoteLayoutId]
        const assignedQuotes = quoteLayout
          ? autoAssignEntriesToSlots({
              layout: quoteLayout,
              existingContent: spread.right_content,
              availableEntries: buildQuotePool(spread),
            })
          : spread.right_content || []

        return {
          ...spread,
          left_layout: layoutId,
          right_layout: quoteLayoutId,
          left_content: leftPhotos,
          right_content: assignedQuotes,
        }
      })
    },
    [activeSpreadIndex, pages, updateSpreadAtIndex, buildPhotoPool, buildQuotePool]
  )

  const handleSelectCoverLayout = useCallback(
    (layoutId: string) => {
      handleSelectPhotoLayout(layoutId)
    },
    [handleSelectPhotoLayout]
  )

  // Auto-generate book
  const handleAutoGenerate = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/auto-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "Failed to auto-generate book")
      }

      const data = await res.json()
      const pagesData = data.pages || []

      setPages(
        pagesData.map((page: BookPage) => ({
          ...page,
          left_content: (page.left_content as any) || [],
          right_content: (page.right_content as any) || [],
        }))
      )
      setActiveSpreadIndex(0)
      scrollToSpreadRef.current(0)
      toast({
        title: "Book regenerated",
        description: "We refreshed your pages from this year’s entries.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to auto-generate book",
        variant: "destructive",
      })
    }
  }, [book.id, toast])

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

    const slotEntry = slotMap.get(overId)
    if (!slotEntry) {
      return
    }
    const { slot, spreadIndex } = slotEntry

    if ((slot.kind === "photo" && !isPhoto) || (slot.kind === "quote" && !isQuote)) {
      toast({
        title: "Wrong slot",
        description: `Drop a ${slot.kind} into this slot`,
        variant: "destructive",
      })
      return
    }

    const newItem: PageContentItem = {
      id: activeId,
      type: slot.kind,
      pageSide: slot.pageSide,
      slotId: slot.id,
      position: {
        x: slot.xPct,
        y: slot.yPct,
        width: slot.widthPct,
        height: slot.heightPct,
      },
    }

    updateSpreadAtIndex(spreadIndex, (spread) => {
      let leftContent = (spread.left_content || []).filter((item) => item.id !== newItem.id)
      let rightContent = (spread.right_content || []).filter((item) => item.id !== newItem.id)

      if (slot.pageSide === "left") {
        leftContent = leftContent.filter((item) => item.slotId !== slot.id)
        leftContent.push(newItem)
      } else {
        rightContent = rightContent.filter((item) => item.slotId !== slot.id)
        rightContent.push(newItem)
      }

      return {
        ...spread,
        left_content: leftContent,
        right_content: rightContent,
      }
    })

    setActiveSpreadIndex(spreadIndex)
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

  const handleAddSpread = useCallback(async () => {
    const defaultPhotoLayout = LAYOUTS_BY_ID[DEFAULT_INTERIOR_PHOTO_LAYOUT_ID]
    const defaultQuoteLayout = LAYOUTS_BY_ID[DEFAULT_INTERIOR_QUOTE_LAYOUT_ID]
    const nextPageNumber = (pages[pages.length - 1]?.page_number || pages.length) + 1

    const payload = {
      book_id: book.id,
      page_number: nextPageNumber,
      left_layout: defaultPhotoLayout?.id ?? null,
      right_layout: defaultQuoteLayout?.id ?? null,
      left_content: [],
      right_content: [],
    }

    try {
      const res = await fetch(`/api/books/${book.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to add pages")
      }

      const saved = await res.json()
      setPages((prev) => [
        ...prev,
        {
          ...saved,
          left_layout: payload.left_layout,
          right_layout: payload.right_layout,
          left_content: [],
          right_content: [],
        },
      ])
      setActiveSpreadIndex(pages.length)
      scrollToSpreadRef.current(pages.length)
      setViewMode("edit")
    } catch (error: any) {
      console.error("Add spread failed", error)
      toast({
        title: "Error",
        description: error.message || "Could not add pages",
        variant: "destructive",
      })
    }
  }, [book.id, pages, toast])

  // Remove item from page
  const handleRemoveItem = (spreadIndex: number, itemId: string) => {
    updateSpreadAtIndex(spreadIndex, (spread) => {
      const leftContent = (spread.left_content || []).filter((item) => item.id !== itemId)
      const rightContent = (spread.right_content || []).filter((item) => item.id !== itemId)
      return {
        ...spread,
        left_content: leftContent,
        right_content: rightContent,
      }
    })
  }

  // Return null on server AND until client is ready to prevent any hydration mismatch
  if (typeof window === "undefined" || !clientReady) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full" suppressHydrationWarning>
        {/* Top Toolbar */}
        <BookToolbar
          book={book}
          onUpdate={handleBookUpdate}
          onAutoGenerate={handleAutoGenerate}
          onToggleManageView={() => setViewMode((prev) => (prev === "manage" ? "edit" : "manage"))}
          isManageView={viewMode === "manage"}
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
              activeSpreadIndex={activeSpreadIndex}
              spreadKind={activeSpreadKind}
              selectedPhotoCount={selectedPhotoCount}
              selectedLeftLayoutId={selectedPhotoLayoutId}
              selectedCoverLayoutId={selectedCoverLayoutId}
              onPhotoCountChange={setSelectedPhotoCount}
              onSelectLeftLayout={handleSelectPhotoLayout}
              onSelectCoverLayout={handleSelectCoverLayout}
            />
          </ResizableSidebar>

          {/* Center Canvas */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "edit" ? (
              <BookCanvas
                spreads={pages}
                spreadKinds={spreadKinds}
                spreadLabels={spreadLabels}
                activeSpreadIndex={activeSpreadIndex}
                zoom={zoom}
                photos={allPhotos}
                quotes={allQuotes}
                persons={initialPersons}
                layoutsById={LAYOUTS_BY_ID}
                onActiveSpreadChange={(index) => setActiveSpreadIndex(index)}
                onRemoveItem={handleRemoveItem}
                buildDroppableId={buildSlotDroppableId}
                onScrollApiChange={(fn) => {
                  if (fn) {
                    scrollToSpreadRef.current = fn
                  }
                }}
              />
            ) : (
              <BookManagePages
                spreads={pages}
                currentIndex={activeSpreadIndex}
                onSelectSpread={(index) => {
                  setActiveSpreadIndex(index)
                  setViewMode("edit")
                  scrollToSpreadRef.current(index)
                }}
                onAddSpread={() => handleAddSpread()}
                getLabel={getSpreadLabel}
              />
            )}
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

