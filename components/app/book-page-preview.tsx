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
  // Calculate page dimensions (6"w x 9"h scaled)
  // For 6x9 book: width=6, height=9, so aspect ratio is 6:9 = 2:3
  // We want to scale to fit nicely on screen while maintaining proportions
  const bookAspectRatio = 6 / 9 // width/height = 0.667
  const maxDisplayWidth = 600 // Max width for a single page
  const pageWidth = maxDisplayWidth
  const pageHeight = pageWidth / bookAspectRatio // Should be ~900px for 600px width

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
    <div className="flex gap-6 items-start">
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
}: {
  side: "left" | "right"
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
        // Single item (photo or quote) full page
        const itemA = content[0]
        if (itemA) {
          const item = getContentItem(itemA.id, itemA.type)
          if (itemA.type === "photo" && item) {
            return (
              <div className="w-full h-full relative">
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <RemoveButton itemId={itemA.id} onRemove={onRemoveItem} />
              </div>
            )
          } else if (itemA.type === "quote" && item) {
            return (
              <div className="w-full h-full flex items-center justify-center p-8 relative">
                <div className="text-center">
                  <p className="text-2xl font-serif">{item.text}</p>
                  {item.said_by && (
                    <p className="text-sm text-muted-foreground mt-4">
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
            message="Drop content here"
          />
        )

      case "B":
        // Two items (top & bottom)
        const itemTop = content[0]
        const itemBottom = content[1]
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative border-b">
              {itemTop ? (
                <>
                  {itemTop.type === "photo" ? (
                    <img
                      src={getContentItem(itemTop.id, "photo")?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p className="text-lg font-serif">
                        {getContentItem(itemTop.id, "quote")?.text}
                      </p>
                    </div>
                  )}
                  <RemoveButton itemId={itemTop.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setTopNodeRef}
                  isOver={isTopOver}
                  message="Drop top content"
                />
              )}
            </div>
            <div className="flex-1 relative">
              {itemBottom ? (
                <>
                  {itemBottom.type === "photo" ? (
                    <img
                      src={getContentItem(itemBottom.id, "photo")?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p className="text-lg font-serif">
                        {getContentItem(itemBottom.id, "quote")?.text}
                      </p>
                    </div>
                  )}
                  <RemoveButton itemId={itemBottom.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setBottomNodeRef}
                  isOver={isBottomOver}
                  message="Drop bottom content"
                />
              )}
            </div>
          </div>
        )

      case "C":
        // Photo top, quote bottom (or vice versa)
        const itemCTop = content.find((c) => c.type === "photo") || content[0]
        const itemCBottom =
          content.find((c) => c.type === "quote") || content[1]
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative border-b">
              {itemCTop ? (
                <>
                  {itemCTop.type === "photo" ? (
                    <img
                      src={getContentItem(itemCTop.id, "photo")?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p className="text-lg font-serif">
                        {getContentItem(itemCTop.id, "quote")?.text}
                      </p>
                    </div>
                  )}
                  <RemoveButton itemId={itemCTop.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setTopNodeRef}
                  isOver={isTopOver}
                  message="Drop photo or quote"
                />
              )}
            </div>
            <div className="flex-1 relative">
              {itemCBottom ? (
                <>
                  {itemCBottom.type === "quote" ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <p className="text-xl font-serif">
                          {getContentItem(itemCBottom.id, "quote")?.text}
                        </p>
                        {getContentItem(itemCBottom.id, "quote")?.said_by && (
                          <p className="text-sm text-muted-foreground mt-2">
                            —{" "}
                            {getPersonName(
                              getContentItem(itemCBottom.id, "quote")?.said_by
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <img
                      src={getContentItem(itemCBottom.id, "photo")?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <RemoveButton itemId={itemCBottom.id} onRemove={onRemoveItem} />
                </>
              ) : (
                <DropZone
                  nodeRef={setBottomNodeRef}
                  isOver={isBottomOver}
                  message="Drop quote or photo"
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
