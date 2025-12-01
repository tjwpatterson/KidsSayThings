"use client"

import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { BookPage, Entry, Person, BookPhoto, Layout, SpreadKind, PageContentItem } from "@/lib/types"

interface BookCanvasProps {
  spread?: BookPage
  leftLayout: Layout | null
  rightLayout: Layout | null
  spreadKind: SpreadKind
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  onRemoveItem: (itemId: string) => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  canNavigatePrev: boolean
  canNavigateNext: boolean
  pageLabel: string
}

export default function BookCanvas({
  spread,
  leftLayout,
  rightLayout,
  spreadKind,
  photos,
  quotes,
  persons,
  onRemoveItem,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev,
  canNavigateNext,
  pageLabel,
}: BookCanvasProps) {
  const coverLabel = spreadKind === "cover" ? "Cover Spread" : "Interior Spread"
  const rightPageLayout =
    spreadKind === "cover" ? rightLayout || leftLayout : rightLayout

  return (
    <div className="flex-1 bg-gradient-to-br from-muted via-background to-muted/30 overflow-auto">
      <div className="w-full max-w-6xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-white shadow text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {coverLabel}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{pageLabel}</span>
        </div>

        <div className="relative bg-white rounded-[32px] shadow-2xl border border-border/40 p-8">
          <div className="flex gap-6">
            <SpreadPage
              side="left"
              layout={leftLayout}
              spread={spread}
              photos={photos}
              quotes={quotes}
              persons={persons}
              onRemoveItem={onRemoveItem}
              label="Left Page · Photos"
            />
            <SpreadPage
              side="right"
              layout={rightPageLayout}
              spread={spread}
              photos={photos}
              quotes={quotes}
              persons={persons}
              onRemoveItem={onRemoveItem}
              label={spreadKind === "cover" ? "Front Cover" : "Right Page · Quotes"}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={onNavigatePrev}
            disabled={!canNavigatePrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Spread
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{pageLabel}</span>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={onNavigateNext}
            disabled={!canNavigateNext}
          >
            Next Spread
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function SpreadPage({
  side,
  layout,
  spread,
  photos,
  quotes,
  persons,
  onRemoveItem,
  label,
}: {
  side: "left" | "right"
  layout: Layout | null
  spread?: BookPage
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  onRemoveItem: (itemId: string) => void
  label: string
}) {
  const content: PageContentItem[] =
    side === "left" ? spread?.left_content || [] : spread?.right_content || []
  const slots = useMemo(
    () => layout?.slots.filter((slot) => slot.pageSide === side) || [],
    [layout, side]
  )

  const getPersonName = (personId: string | null | undefined) => {
    if (!personId) return null
    return persons.find((p) => p.id === personId)?.display_name || null
  }

  if (!layout) {
    return (
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
          <span>{label}</span>
        </div>
        <div className="relative bg-muted/20 rounded-2xl border border-dashed border-border/40 aspect-[2/3] overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-sm text-muted-foreground">
            <p>Choose a layout from the Layouts panel to start designing this page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
          <span>{label}</span>
          <span className="text-[10px] font-medium text-muted-foreground/70">0 slots</span>
        </div>
        <div className="relative bg-white rounded-2xl border border-border/50 aspect-[2/3] overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-xs text-muted-foreground">
            <p>This layout keeps this page intentionally blank.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
        <span>{label}</span>
        <span className="text-[10px] font-medium text-muted-foreground/70">
          {slots.length} slot{slots.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="relative bg-muted/20 rounded-2xl border border-border/50 aspect-[2/3] overflow-hidden shadow-inner">
        {slots.map((slot) => (
          <SpreadSlot
            key={slot.id}
            slot={slot}
            content={content}
            photos={photos}
            quotes={quotes}
            getPersonName={getPersonName}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </div>
  )
}

function SpreadSlot({
  slot,
  content,
  photos,
  quotes,
  getPersonName,
  onRemoveItem,
}: {
  slot: Layout["slots"][number]
  content: PageContentItem[]
  photos: BookPhoto[]
  quotes: Entry[]
  getPersonName: (id: string | null | undefined) => string | null
  onRemoveItem: (itemId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id })
  const existing =
    content.find((item) => item.slotId === slot.id) ||
    content.find((item) => item.type === slot.kind && !item.slotId)

  const isPhotoSlot = slot.kind === "photo"
  const assignedPhoto = existing && existing.type === "photo" ? photos.find((p) => p.id === existing.id) : null
  const assignedQuote = existing && existing.type === "quote" ? quotes.find((q) => q.id === existing.id) : null

  return (
    <div
      ref={setNodeRef}
      className={`absolute rounded-lg overflow-hidden transition-all border ${
        isOver ? "border-primary shadow-xl shadow-primary/30" : "border-border/60"
      }`}
      style={{
        left: `${slot.xPct}%`,
        top: `${slot.yPct}%`,
        width: `${slot.widthPct}%`,
        height: `${slot.heightPct}%`,
      }}
    >
      {assignedPhoto && (
        <div className="w-full h-full relative">
          <img src={assignedPhoto.url} alt="" className="w-full h-full object-cover" />
          <RemoveSlotButton itemId={assignedPhoto.id} onRemove={onRemoveItem} />
        </div>
      )}

      {assignedQuote && (
        <div className="w-full h-full relative bg-white flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-serif leading-snug line-clamp-5">{assignedQuote.text}</p>
          {assignedQuote.said_by && (
            <p className="text-xs text-muted-foreground mt-2">— {getPersonName(assignedQuote.said_by)}</p>
          )}
          <RemoveSlotButton itemId={assignedQuote.id} onRemove={onRemoveItem} />
        </div>
      )}

      {!assignedPhoto && !assignedQuote && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 text-center px-3 text-xs text-muted-foreground gap-1">
          <span className="font-semibold">{isPhotoSlot ? "Drop a photo" : "Drop a quote"}</span>
          <span className="text-[10px]">Slot {slot.id.split("-").pop()}</span>
        </div>
      )}
    </div>
  )
}

function RemoveSlotButton({
  itemId,
  onRemove,
}: {
  itemId: string
  onRemove: (itemId: string) => void
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="absolute top-2 right-2 h-6 w-6 rounded-full shadow"
      onClick={(e) => {
        e.stopPropagation()
        onRemove(itemId)
      }}
    >
      <X className="h-3 w-3" />
    </Button>
  )
}
