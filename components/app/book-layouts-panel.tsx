"use client"

import { Fragment } from "react"
import type { Layout, SpreadKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getCoverLayouts,
  getPhotoLayouts,
  getQuoteLayouts,
} from "@/lib/books/layouts"

const PHOTO_OPTIONS = [1, 2, 3, 4]

interface LayoutsPanelProps {
  spreadKind: SpreadKind
  selectedPhotoCount: number
  selectedCoverLayoutId: string | null
  selectedPhotoLayoutId: string | null
  onPhotoCountChange: (count: number) => void
  onSelectPhotoLayout: (layoutId: string) => void
  onSelectCoverLayout: (layoutId: string) => void
}

export default function BookLayoutsPanel({
  spreadKind,
  selectedPhotoCount,
  selectedCoverLayoutId,
  selectedPhotoLayoutId,
  onPhotoCountChange,
  onSelectPhotoLayout,
  onSelectCoverLayout,
}: LayoutsPanelProps) {
  if (spreadKind === "cover") {
    const coverLayouts = getCoverLayouts()

    return (
      <div className="flex-1 border-r border-border/50 bg-gradient-to-b from-background to-muted/20 flex flex-col overflow-hidden min-w-[200px]">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Cover Layouts</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a wrap or photo-forward cover style
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <LayoutGrid
            layouts={coverLayouts}
            selectedId={selectedCoverLayoutId}
            onSelect={onSelectCoverLayout}
          />
        </div>
      </div>
    )
  }

  const photoLayouts = getPhotoLayouts(selectedPhotoCount)

  return (
    <div className="flex-1 border-r border-border/50 bg-gradient-to-b from-background to-muted/20 flex flex-col overflow-hidden min-w-[200px]">
      <div className="p-4 border-b space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-3">Left Page · Photos</h3>
          <div className="flex flex-wrap gap-2">
            {PHOTO_OPTIONS.map((count) => (
              <Button
                key={count}
                size="sm"
                variant={count === selectedPhotoCount ? "default" : "outline"}
                className={cn(
                  "h-7 text-xs px-3",
                  count === selectedPhotoCount && "bg-primary text-primary-foreground"
                )}
                onClick={() => onPhotoCountChange(count)}
              >
                {count} {count === 1 ? "photo" : "photos"}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Choose a photo-forward layout for the left page. We’ll auto-pair the right page with a matching quote layout.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <LayoutGrid
          layouts={photoLayouts}
          selectedId={selectedPhotoLayoutId}
          onSelect={onSelectPhotoLayout}
        />
      </div>
    </div>
  )
}

function LayoutGrid({
  layouts,
  selectedId,
  onSelect,
}: {
  layouts: Layout[]
  selectedId: string | null
  onSelect: (layoutId: string) => void
}) {
  if (layouts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 py-8 text-center text-sm text-muted-foreground">
        No layouts available yet
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {layouts.map((layout) => (
        <LayoutThumbnail
          key={layout.id}
          layout={layout}
          selected={layout.id === selectedId}
          onClick={() => onSelect(layout.id)}
        />
      ))}
    </div>
  )
}

function LayoutThumbnail({
  layout,
  selected,
  onClick,
}: {
  layout: Layout
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-2 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary shadow-lg shadow-primary/20 bg-primary/5"
          : "border-border/60 bg-white"
      )}
    >
      <div className="w-full aspect-[2/1] rounded-lg bg-muted flex items-stretch gap-1 overflow-hidden">
        {(["left", "right"] as const).map((side) => (
          <div
            key={side}
            className={cn(
              "flex-1 relative bg-white shadow-inner rounded-md border border-border/30 overflow-hidden",
              side === "left" ? "pl-1" : "pr-1"
            )}
          >
            {layout.slots
              .filter((slot) => slot.pageSide === side)
              .map((slot) => (
                <span
                  key={slot.id}
                  className={cn(
                    "absolute rounded-sm opacity-90",
                    slot.kind === "photo" ? "bg-primary/30" : "bg-amber-200/80"
                  )}
                  style={{
                    left: `${slot.xPct}%`,
                    top: `${slot.yPct}%`,
                    width: `${slot.widthPct}%`,
                    height: `${slot.heightPct}%`,
                  }}
                />
              ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-foreground line-clamp-1">{layout.name}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {layout.photoCount > 0 && (
          <Fragment>{layout.photoCount} photo{layout.photoCount === 1 ? "" : "s"} · </Fragment>
        )}
        {layout.quoteCount > 0 && (
          <Fragment>{layout.quoteCount} quote{layout.quoteCount === 1 ? "" : "s"}</Fragment>
        )}
        {layout.quoteCount === 0 && layout.photoCount === 0 && "Slots TBD"}
      </p>
    </button>
  )
}


