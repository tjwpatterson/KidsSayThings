"use client"

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
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFullPageQuoteStyle,
  getPartialPageQuoteStyle,
  attributionStyle,
} from "@/lib/typography"

interface BookPagePreviewProps {
  book: Book
  page: BookPage | undefined
  leftLayout: PageLayout | null
  rightLayout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  onRemoveItem: (side: "left" | "right", itemId: string) => void
}

export default function BookPagePreview({
  book,
  page,
  leftLayout,
  rightLayout,
  photos,
  quotes,
  persons,
  onRemoveItem,
}: BookPagePreviewProps) {
  // Calculate page dimensions (6"w x 9"h scaled to realistic size)
  // For 6x9 book: width=6, height=9, so aspect ratio is 6:9 = 2:3
  // Scale to a more realistic size that doesn't dominate the screen
  const bookAspectRatio = 6 / 9 // width/height = 0.667
  const maxDisplayWidth = 320 // Smaller, more realistic width for a single page (was 600)
  const pageWidth = maxDisplayWidth
  const pageHeight = pageWidth / bookAspectRatio // ~480px for 320px width

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

  return (
    <div className="flex gap-3 items-start">
      {/* Left Page */}
      <div
        className="bg-white shadow-xl rounded-lg border-2 border-border shrink-0"
        style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
      >
        <PageSide
          side="left"
          layout={leftLayout}
          content={page?.left_content || []}
          getContentItem={getContentItem}
          getPersonName={getPersonName}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          onRemoveItem={(itemId) => onRemoveItem("left", itemId)}
          layoutType="photo"
        />
      </div>

      {/* Right Page */}
      <div
        className="bg-white shadow-xl rounded-lg border-2 border-border shrink-0"
        style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
      >
        <PageSide
          side="right"
          layout={rightLayout}
          content={page?.right_content || []}
          getContentItem={getContentItem}
          getPersonName={getPersonName}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          onRemoveItem={(itemId) => onRemoveItem("right", itemId)}
          layoutType="quote"
        />
      </div>
    </div>
  )
}

function PageSide({
  side,
  layout,
  content,
  getContentItem,
  getPersonName,
  pageWidth,
  pageHeight,
  onRemoveItem,
  layoutType,
}: {
  side: "left" | "right"
  layout: PageLayout | null
  content: PageContentItem[]
  getContentItem: (id: string, type: "photo" | "quote") => any
  getPersonName: (id: string | null) => string | null
  pageWidth: number
  pageHeight: number
  onRemoveItem: (itemId: string) => void
  layoutType: "photo" | "quote"
}) {
  // Main drop zone for layout A
  const { setNodeRef: setMainNodeRef, isOver: isMainOver } = useDroppable({
    id: `${side}-page-main`,
  })

  // Top drop zone for layouts B and C
  const { setNodeRef: setTopNodeRef, isOver: isTopOver } = useDroppable({
    id: `${side}-page-top`,
  })

  // Bottom drop zone for layouts B and C
  const { setNodeRef: setBottomNodeRef, isOver: isBottomOver } = useDroppable({
    id: `${side}-page-bottom`,
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
          Select a layout option
        </span>
      </div>
    )
  }

  const renderLayout = () => {
    switch (layout) {
      case "A":
        // Layout A: Full page photo with small margin OR full page quote
        const itemA = content[0]
        if (itemA) {
          const item = getContentItem(itemA.id, itemA.type)
          if (itemA.type === "photo" && item) {
            // Full page photo with margin (CSS cropping)
            return (
              <div className="w-full h-full relative p-3">
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
              <div className="w-full h-full flex items-center justify-center p-8 relative">
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
        // Customize message based on layout type
        const dropMessage = layoutType === "photo" ? "Drop Photo" : "Drop Quote"
        return (
          <DropZone
            nodeRef={setMainNodeRef}
            isOver={isMainOver}
            message={dropMessage}
          />
        )

      case "B":
        // Layout B: Photo 2/3 + Quote 1/3 (photo can be top or bottom)
        // Find photo and quote in content
        const photoItem = content.find((c) => c.type === "photo")
        const quoteItem = content.find((c) => c.type === "quote")
        
        // Determine if photo should be on top (default) or bottom
        // If photo is first in content array, it's on top; otherwise bottom
        const photoOnTop = !photoItem || content.indexOf(photoItem) < content.indexOf(quoteItem || content[0])
        
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
