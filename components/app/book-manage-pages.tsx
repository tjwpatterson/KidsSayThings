"use client"

import { Button } from "@/components/ui/button"
import type { BookPage, Layout } from "@/lib/types"
import { LAYOUTS_BY_ID } from "@/lib/books/layouts"
import { cn } from "@/lib/utils"

interface BookManagePagesProps {
  spreads: BookPage[]
  currentIndex: number
  onSelectSpread: (index: number) => void
  onAddSpread: () => void
  getLabel: (spread: BookPage, index: number) => string
}

export default function BookManagePages({
  spreads,
  currentIndex,
  onSelectSpread,
  onAddSpread,
  getLabel,
}: BookManagePagesProps) {
  return (
    <div className="h-full overflow-y-auto bg-muted/10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Manage Pages</h2>
            <p className="text-sm text-muted-foreground">Jump to any spread or add two new pages.</p>
          </div>
          <Button onClick={onAddSpread}>Add 2 pages</Button>
        </div>

        {spreads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-white p-10 text-center text-sm text-muted-foreground">
            No spreads yet. Use “Add 2 pages” to start.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {spreads.map((spread, index) => (
              <button
                key={spread.id || index}
                className={cn(
                  "rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  currentIndex === index
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-border/60"
                )}
                onClick={() => onSelectSpread(index)}
              >
                <SpreadThumbnail spread={spread} />
                <div className="mt-3">
                  <p className="text-sm font-semibold text-foreground">{getLabel(spread, index)}</p>
                  <p className="text-xs text-muted-foreground">
                    Layouts: {spread.left_layout || "—"} / {spread.right_layout || "—"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onAddSpread}>
            Add 2 pages
          </Button>
        </div>
      </div>
    </div>
  )
}

function SpreadThumbnail({ spread }: { spread: BookPage }) {
  const leftLayout = spread.left_layout ? LAYOUTS_BY_ID[spread.left_layout] : null
  const rightLayout = spread.right_layout ? LAYOUTS_BY_ID[spread.right_layout] : null
  const coverRightLayout =
    rightLayout ||
    (leftLayout && leftLayout.slots.some((slot) => slot.pageSide === "right") ? leftLayout : null)

  const renderPage = (layout: Layout | null, side: "left" | "right") => {
    const slots = layout?.slots.filter((slot) => slot.pageSide === side) || []
    return (
      <div className="flex-1 relative bg-muted/20 rounded-xl border border-border/50 overflow-hidden">
        {slots.map((slot) => (
          <span
            key={slot.id}
            className={cn(
              "absolute rounded-sm opacity-70",
              slot.kind === "photo" ? "bg-primary/30" : "bg-amber-200/70"
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
    )
  }

  return (
    <div className="aspect-[2/1] flex gap-1">
      {renderPage(leftLayout, "left")}
      {renderPage(coverRightLayout, "right")}
    </div>
  )
}

