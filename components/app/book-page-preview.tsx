"use client"

import { useState, useEffect } from "react"
import { useDroppable } from "@dnd-kit/core"
import type {
  Book,
  BookPage,
  BookPhoto,
  Entry,
  Person,
  PageLayout,
  PageContentItem,
} from "@/lib/types"
import { X, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFullPageQuoteStyle,
  getPartialPageQuoteStyle,
  attributionStyle,
} from "@/lib/typography"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import BookLayoutSelectorVisual from "./book-layout-selector-visual"

interface BookPagePreviewProps {
  book: Book
  page: BookPage | undefined
  layout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  onLayoutChange: (layout: PageLayout | null) => void
  onRemoveItem: (itemId: string) => void
}

export default function BookPagePreview({
  book,
  page,
  layout,
  photos,
  quotes,
  persons,
  onLayoutChange,
  onRemoveItem,
}: BookPagePreviewProps) {
  const [mounted, setMounted] = useState(false)

  // Only render Popover on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate page dimensions (6"w x 9"h scaled to realistic size)
  const bookAspectRatio = 6 / 9 // width/height = 0.667
  const maxDisplayWidth = 400 // Larger for single page view
  const pageWidth = maxDisplayWidth
  const pageHeight = pageWidth / bookAspectRatio // ~600px for 400px width

  const getPersonName = (personId: string | null) => {
    if (!personId) return null
    return persons.find((p) => p.id === personId)?.display_name || null
  }

  const getContentItem = (itemId: string, type: "photo" | "quote") => {
    if (type === "photo") {
      return photos.find((p) => p.id === itemId)
    } else {
      return quotes.find((q) => q.id === itemId)
    }
  }

  const content = page?.left_content || [] // Use left_content for single page

  return (
    <div className="relative">
      {/* Single Page Preview */}
      <div
        className="bg-white shadow-xl rounded-lg border-2 border-border mx-auto relative"
        style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
      >
        {/* Layout Selector Button - appears when no layout or as badge when layout selected */}
        {mounted && (
          <div className="absolute top-4 right-4 z-10">
            {layout ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-background/95 backdrop-blur-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="text-xs">
                      {layout === "A" ? "Full Page" : "Photo + Quote"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Page Layout</h4>
                      <BookLayoutSelectorVisual
                        selected={layout}
                        onSelect={(newLayout) => {
                          try {
                            if (onLayoutChange) {
                              onLayoutChange(newLayout)
                            }
                          } catch (error) {
                            console.error("Error changing layout:", error)
                          }
                        }}
                        type="photo"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Choose Page Layout
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Choose Page Layout</h4>
                      <BookLayoutSelectorVisual
                        selected={null}
                        onSelect={(newLayout) => {
                          try {
                            if (onLayoutChange) {
                              onLayoutChange(newLayout)
                            }
                          } catch (error) {
                            console.error("Error changing layout:", error)
                          }
                        }}
                        type="photo"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {/* Page Content */}
        <PageSide
          layout={layout}
          content={content}
          getContentItem={getContentItem}
          getPersonName={getPersonName}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          onRemoveItem={onRemoveItem}
        />
      </div>
    </div>
  )
}

function PageSide({
  layout,
  content,
  getContentItem,
  getPersonName,
  pageWidth,
  pageHeight,
  onRemoveItem,
}: {
  layout: PageLayout | null
  content: PageContentItem[]
  getContentItem: (id: string, type: "photo" | "quote") => any
  getPersonName: (id: string | null) => string | null
  pageWidth: number
  pageHeight: number
  onRemoveItem: (itemId: string) => void
}) {
  // Main drop zone for layout A
  const { setNodeRef: setMainNodeRef, isOver: isMainOver } = useDroppable({
    id: "page-main",
  })

  // Top drop zone for layout B
  const { setNodeRef: setTopNodeRef, isOver: isTopOver } = useDroppable({
    id: "page-top",
  })

  // Bottom drop zone for layout B
  const { setNodeRef: setBottomNodeRef, isOver: isBottomOver } = useDroppable({
    id: "page-bottom",
  })

  if (!layout) {
    return (
      <div
        ref={setMainNodeRef}
        className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded ${
          isMainOver ? "border-primary bg-primary/5" : "border-muted"
        }`}
      >
        <span className="text-sm text-muted-foreground">
          Choose a layout to get started
        </span>
      </div>
    )
  }

  const renderLayout = () => {
    switch (layout) {
      case "A":
        // Full page layout
        const itemA = content[0]
        if (itemA) {
          const item = getContentItem(itemA.id, itemA.type)
          if (itemA.type === "photo" && item) {
            // Full page photo with margin
            return (
              <div ref={setMainNodeRef} className="w-full h-full relative p-3">
                <div className="w-full h-full rounded overflow-hidden">
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <RemoveButton itemId={itemA.id} onRemove={onRemoveItem} />
              </div>
            )
          } else if (itemA.type === "quote" && item) {
            // Full page quote with auto-scaling typography
            const quoteStyle = getFullPageQuoteStyle(item.text)
            return (
              <div ref={setMainNodeRef} className="w-full h-full flex items-center justify-center p-8 relative">
                <div className="text-center" style={{ maxWidth: quoteStyle.maxWidth }}>
                  <p
                    className="font-serif"
                    style={{
                      fontSize: quoteStyle.fontSize,
                      lineHeight: quoteStyle.lineHeight,
                    }}
                  >
                    {item.text}
                  </p>
                  {item.said_by && (
                    <p
                      className="text-muted-foreground mt-4 italic"
                      style={{
                        fontSize: attributionStyle.fontSize,
                        lineHeight: attributionStyle.lineHeight,
                      }}
                    >
                      — {getPersonName(item.said_by)}
                    </p>
                  )}
                </div>
                <RemoveButton itemId={itemA.id} onRemove={onRemoveItem} />
              </div>
            )
          }
        }
        return (
          <DropZone
            nodeRef={setMainNodeRef}
            isOver={isMainOver}
            message="Drop Photo or Quote"
          />
        )

      case "B":
        // Photo 2/3 + Quote 1/3
        const photoItem = content.find((c) => c.type === "photo")
        const quoteItem = content.find((c) => c.type === "quote")
        
        return (
          <div className="w-full h-full flex flex-col">
            {/* Photo area - 2/3 of page */}
            <div className="flex-[2] relative border-b">
              {photoItem ? (
                <>
                  <div className="w-full h-full p-2">
                    <div className="w-full h-full rounded overflow-hidden">
                      <img
                        src={getContentItem(photoItem.id, "photo")?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <RemoveButton itemId={photoItem.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setTopNodeRef}
                  isOver={isTopOver}
                  message="Drop Photo"
                />
              )}
            </div>
            
            {/* Quote area - 1/3 of page */}
            <div className="flex-1 relative">
              {quoteItem ? (
                <>
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {(() => {
                      const quote = getContentItem(quoteItem.id, "quote")
                      if (!quote) return null
                      const quoteStyle = getPartialPageQuoteStyle(quote.text)
                      return (
                        <div className="text-center" style={{ maxWidth: quoteStyle.maxWidth }}>
                          <p
                            className="font-serif"
                            style={{
                              fontSize: quoteStyle.fontSize,
                              lineHeight: quoteStyle.lineHeight,
                            }}
                          >
                            {quote.text}
                          </p>
                          {quote.said_by && (
                            <p
                              className="text-muted-foreground mt-2 italic"
                              style={{
                                fontSize: attributionStyle.fontSize,
                                lineHeight: attributionStyle.lineHeight,
                              }}
                            >
                              — {getPersonName(quote.said_by)}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <RemoveButton itemId={quoteItem.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setBottomNodeRef}
                  isOver={isBottomOver}
                  message="Drop Quote"
                />
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full h-full relative">{renderLayout()}</div>
  )
}

function DropZone({
  nodeRef,
  isOver,
  message,
}: {
  nodeRef: (node: HTMLElement | null) => void
  isOver: boolean
  message: string
}) {
  return (
    <div
      ref={nodeRef}
      className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded ${
        isOver ? "border-primary bg-primary/10" : "border-muted"
      }`}
    >
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}

function RemoveButton({
  itemId,
  onRemove,
}: {
  itemId: string
  onRemove: (itemId: string) => void
}) {
  return (
    <Button
      variant="destructive"
      size="sm"
      className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
      onClick={(e) => {
        e.stopPropagation()
        onRemove(itemId)
      }}
    >
      <X className="h-3 w-3" />
    </Button>
  )
}
