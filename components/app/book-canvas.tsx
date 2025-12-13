"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  BookPage,
  Entry,
  Person,
  BookPhoto,
  Layout,
  SpreadKind,
  PageContentItem,
} from "@/lib/types"

interface BookCanvasProps {
  spreads: BookPage[]
  spreadKinds: SpreadKind[]
  spreadLabels: string[]
  activeSpreadIndex: number
  zoom: number
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  layoutsById: Record<string, Layout>
  onActiveSpreadChange: (index: number) => void
  onRemoveItem: (spreadIndex: number, itemId: string) => void
  buildDroppableId: (spread: BookPage, spreadIndex: number, slotId: string) => string
  onScrollApiChange?: (scrollToSpread: (index: number) => void) => void
}

export default function BookCanvas({
  spreads,
  spreadKinds,
  spreadLabels,
  activeSpreadIndex,
  zoom,
  photos,
  quotes,
  persons,
  layoutsById,
  onActiveSpreadChange,
  onRemoveItem,
  buildDroppableId,
  onScrollApiChange,
}: BookCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const spreadRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollToSpread = useCallback((index: number) => {
    const node = spreadRefs.current[index]
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  useEffect(() => {
    if (onScrollApiChange) {
      onScrollApiChange(scrollToSpread)
    }
  }, [onScrollApiChange, scrollToSpread])

  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root) return

    spreadRefs.current = spreadRefs.current.slice(0, spreads.length)
    const observers: IntersectionObserver[] = []

    spreads.forEach((_, index) => {
      const node = spreadRefs.current[index]
      if (!node) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onActiveSpreadChange(index)
          }
        },
        { root, threshold: 0.5 }
      )
      observer.observe(node)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [spreads, onActiveSpreadChange])

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex-1 bg-gradient-to-br from-muted via-background to-muted/30 overflow-y-auto"
      )}
    >
      <div
        className="w-full max-w-6xl mx-auto py-10 px-6 flex flex-col gap-10 pb-20"
        style={{ zoom: `${zoom}%`, transformOrigin: "top center" }}
      >
        {spreads.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-border/50 bg-white/80 p-10 text-center text-sm text-muted-foreground">
            No spreads yet. Use the layouts panel or Manage Pages to add your first spread.
          </div>
        ) : (
          spreads.map((spread, index) => (
            <SpreadPair
              key={spread.id || index}
              spread={spread}
              spreadIndex={index}
              spreadKind={spreadKinds[index] ?? "cover"}
              spreadLabel={spreadLabels[index] || `Spread ${index + 1}`}
              active={activeSpreadIndex === index}
              photos={photos}
              quotes={quotes}
              persons={persons}
              layoutsById={layoutsById}
              onRemoveItem={onRemoveItem}
              containerRef={(node) => {
                spreadRefs.current[index] = node
              }}
              buildDroppableId={buildDroppableId}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SpreadPair({
  spread,
  spreadIndex,
  spreadKind,
  spreadLabel,
  active,
  photos,
  quotes,
  persons,
  layoutsById,
  onRemoveItem,
  containerRef,
  buildDroppableId,
}: {
  spread: BookPage
  spreadIndex: number
  spreadKind: SpreadKind
  spreadLabel: string
  active: boolean
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  layoutsById: Record<string, Layout>
  onRemoveItem: (spreadIndex: number, itemId: string) => void
  containerRef: (node: HTMLDivElement | null) => void
  buildDroppableId: (spread: BookPage, spreadIndex: number, slotId: string) => string
}) {
  const leftLayout = spread.left_layout ? layoutsById[spread.left_layout] || null : null
  const rightLayout =
    spreadKind === "cover"
      ? spread.right_layout
        ? layoutsById[spread.right_layout] || null
        : leftLayout
      : spread.right_layout
      ? layoutsById[spread.right_layout] || null
      : null

  const leftLabel = spreadKind === "cover" ? "Back Cover" : "Left Page · Photos"
  const rightLabel = spreadKind === "cover" ? "Front Cover" : "Right Page · Quotes"

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-white rounded-[32px] border border-border/40 p-8 shadow-xl transition-all min-h-[520px]",
        active ? "ring-2 ring-primary shadow-2xl" : "shadow-lg"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {spreadKind === "cover" ? "Cover Spread" : "Interior Spread"}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{spreadLabel}</span>
      </div>

      <div className="flex gap-6">
        <SpreadPage
          side="left"
          spread={spread}
          spreadIndex={spreadIndex}
          layout={leftLayout}
          photos={photos}
          quotes={quotes}
          persons={persons}
          onRemoveItem={onRemoveItem}
          label={leftLabel}
          buildDroppableId={buildDroppableId}
        />
        <SpreadPage
          side="right"
          spread={spread}
          spreadIndex={spreadIndex}
          layout={rightLayout}
          photos={photos}
          quotes={quotes}
          persons={persons}
          onRemoveItem={onRemoveItem}
          label={rightLabel}
          buildDroppableId={buildDroppableId}
        />
      </div>
    </div>
  )
}

function SpreadPage({
  side,
  spread,
  spreadIndex,
  layout,
  photos,
  quotes,
  persons,
  onRemoveItem,
  label,
  buildDroppableId,
}: {
  side: "left" | "right"
  spread: BookPage
  spreadIndex: number
  layout: Layout | null
  photos: BookPhoto[]
  quotes: Entry[]
  persons: Person[]
  onRemoveItem: (spreadIndex: number, itemId: string) => void
  label: string
  buildDroppableId: (spread: BookPage, spreadIndex: number, slotId: string) => string
}) {
  const content: PageContentItem[] = side === "left" ? spread.left_content || [] : spread.right_content || []
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
        {slots.map((slot) => {
          const droppableId = buildDroppableId(spread, spreadIndex, slot.id)
          return (
            <SpreadSlot
              key={droppableId}
              slot={slot}
              droppableId={droppableId}
              spreadIndex={spreadIndex}
              content={content}
              photos={photos}
              quotes={quotes}
              getPersonName={getPersonName}
              onRemoveItem={onRemoveItem}
            />
          )
        })}
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
  droppableId,
  spreadIndex,
}: {
  slot: Layout["slots"][number]
  content: PageContentItem[]
  photos: BookPhoto[]
  quotes: Entry[]
  getPersonName: (id: string | null | undefined) => string | null
  onRemoveItem: (spreadIndex: number, itemId: string) => void
  droppableId: string
  spreadIndex: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  const existing =
    content.find((item) => item.slotId === slot.id) ||
    content.find((item) => item.type === slot.kind && !item.slotId)

  const isPhotoSlot = slot.kind === "photo"
  const assignedPhoto = existing && existing.type === "photo" ? photos.find((p) => p.id === existing.id) : null
  const assignedQuote = existing && existing.type === "quote" ? quotes.find((q) => q.id === existing.id) : null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute rounded-lg overflow-hidden transition-all border",
        isOver ? "border-primary shadow-xl shadow-primary/30" : "border-border/60"
      )}
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
          <RemoveSlotButton onRemove={() => onRemoveItem(spreadIndex, assignedPhoto.id)} />
        </div>
      )}

      {assignedQuote && (
        <div className="w-full h-full relative bg-white flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-serif leading-snug line-clamp-5">{assignedQuote.text}</p>
          {assignedQuote.said_by && (
            <p className="text-xs text-muted-foreground mt-2">— {getPersonName(assignedQuote.said_by)}</p>
          )}
          <RemoveSlotButton onRemove={() => onRemoveItem(spreadIndex, assignedQuote.id)} />
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

function RemoveSlotButton({ onRemove }: { onRemove: () => void }) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="absolute top-2 right-2 h-6 w-6 rounded-full shadow"
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
    >
      <X className="h-3 w-3" />
    </Button>
  )
}
