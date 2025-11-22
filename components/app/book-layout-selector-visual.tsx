"use client"

import { cn } from "@/lib/utils"
import type { PageLayout } from "@/lib/types"

interface BookLayoutSelectorVisualProps {
  selected: PageLayout | null
  onSelect: (layout: PageLayout | null) => void
  type: "photo" | "quote"
}

export default function BookLayoutSelectorVisual({
  selected,
  onSelect,
  type,
}: BookLayoutSelectorVisualProps) {
  const layouts =
    type === "photo"
      ? [
          {
            value: "A" as PageLayout,
            label: "1 Photo",
            description: "Full page",
            preview: (
              <div className="w-full h-12 bg-muted rounded border-2 border-dashed flex items-center justify-center">
                <div className="w-10 h-10 bg-primary/20 rounded" />
              </div>
            ),
          },
          {
            value: "B" as PageLayout,
            label: "2 Photos",
            description: "Top & bottom",
            preview: (
              <div className="w-full h-12 bg-muted rounded border-2 border-dashed flex flex-col gap-0.5 p-0.5">
                <div className="flex-1 bg-primary/20 rounded" />
                <div className="flex-1 bg-primary/20 rounded" />
              </div>
            ),
          },
          {
            value: "C" as PageLayout,
            label: "Photo + Quote",
            description: "Photo top, quote bottom",
            preview: (
              <div className="w-full h-20 bg-muted rounded border-2 border-dashed flex flex-col gap-1 p-1">
                <div className="flex-1 bg-primary/20 rounded" />
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-12 h-2 bg-foreground/20 rounded" />
                </div>
              </div>
            ),
          },
        ]
      : [
          {
            value: "A" as PageLayout,
            label: "1 Quote",
            description: "Centered",
            preview: (
              <div className="w-full h-12 bg-muted rounded border-2 border-dashed flex items-center justify-center">
                <div className="w-8 h-1.5 bg-primary/20 rounded" />
              </div>
            ),
          },
          {
            value: "B" as PageLayout,
            label: "2 Quotes",
            description: "Top & bottom",
            preview: (
              <div className="w-full h-12 bg-muted rounded border-2 border-dashed flex flex-col gap-0.5 p-0.5">
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-8 h-1.5 bg-foreground/20 rounded" />
                </div>
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-8 h-1.5 bg-foreground/20 rounded" />
                </div>
              </div>
            ),
          },
          {
            value: "C" as PageLayout,
            label: "Photo + Quote",
            description: "Photo top, quote bottom",
            preview: (
              <div className="w-full h-20 bg-muted rounded border-2 border-dashed flex flex-col gap-1 p-1">
                <div className="flex-1 bg-primary/20 rounded" />
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-12 h-2 bg-foreground/20 rounded" />
                </div>
              </div>
            ),
          },
        ]

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {layouts.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onSelect(selected === layout.value ? null : layout.value)}
          className={cn(
            "p-1.5 rounded border-2 transition-all text-left",
            selected === layout.value
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="mb-1">{layout.preview}</div>
          <div className="text-[10px] font-medium leading-tight">{layout.label}</div>
          <div className="text-[9px] text-muted-foreground leading-tight">{layout.description}</div>
        </button>
      ))}
    </div>
  )
}

