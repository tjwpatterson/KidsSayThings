"use client"

import type { BookPage, BookPhoto, Entry, Person, PageLayout } from "@/lib/types"

interface PageThumbnailPreviewProps {
  page: BookPage
  layout: PageLayout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  width: number
  height: number
}

export default function PageThumbnailPreview({
  page,
  layout,
  photos,
  quotes,
  persons,
  width,
  height,
}: PageThumbnailPreviewProps) {
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

  const isPhoto = (item: BookPhoto | Entry | undefined): item is BookPhoto => {
    return Boolean(item && typeof (item as BookPhoto).url === "string")
  }

  const isQuote = (item: BookPhoto | Entry | undefined): item is Entry => {
    return Boolean(item && typeof (item as Entry).text === "string")
  }

  const content = page?.left_content || []

  if (!layout) {
    return (
      <div className="w-full h-full bg-muted/30 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
        <span className="text-[6px] text-muted-foreground">Empty</span>
      </div>
    )
  }

  const renderThumbnail = () => {
    switch (layout) {
      case "A": {
        const itemA = content[0]
        if (itemA) {
          const item = getContentItem(itemA.id, itemA.type)
          if (itemA.type === "photo" && isPhoto(item)) {
            return (
              <div className="w-full h-full p-0.5 rounded overflow-hidden">
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              </div>
            )
          } else if (itemA.type === "quote" && isQuote(item)) {
            return (
              <div className="w-full h-full flex items-center justify-center p-1 bg-white rounded">
                <p className="text-[5px] font-serif text-center leading-tight line-clamp-3">
                  {item.text}
                </p>
              </div>
            )
          }
        }
        return (
          <div className="w-full h-full bg-muted/20 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
            <span className="text-[5px] text-muted-foreground">Empty</span>
          </div>
        )
      }
      case "B": {
        const photoItem = content.find((c) => c.type === "photo")
        const quoteItem = content.find((c) => c.type === "quote")
        return (
          <div className="w-full h-full flex flex-col gap-0.5 p-0.5 bg-white rounded">
            {photoItem ? (
              <div className="flex-[2] rounded overflow-hidden">
                {(() => {
                  const photo = getContentItem(photoItem.id, "photo")
                  if (isPhoto(photo)) {
                    return (
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )
                  }
                  return <div className="w-full h-full bg-muted/30 border border-dashed border-muted-foreground/20 rounded" />
                })()}
              </div>
            ) : (
              <div className="flex-[2] bg-muted/30 border border-dashed border-muted-foreground/20 rounded" />
            )}
            {quoteItem ? (
              <div className="flex-1 flex items-center justify-center p-0.5 bg-muted/10 rounded">
                {(() => {
                  const quote = getContentItem(quoteItem.id, "quote")
                  if (isQuote(quote)) {
                    return (
                      <p className="text-[4px] font-serif text-center leading-tight line-clamp-1">
                        {quote.text}
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            ) : (
              <div className="flex-1 bg-muted/20 border border-dashed border-muted-foreground/20 rounded" />
            )}
          </div>
        )
      }
      default:
        return (
          <div className="w-full h-full bg-muted/30 rounded flex items-center justify-center">
            <span className="text-[6px] text-muted-foreground">Empty</span>
          </div>
        )
    }
  }

  return (
    <div
      className="w-full h-full bg-white rounded overflow-hidden shadow-sm"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {renderThumbnail()}
    </div>
  )
}

