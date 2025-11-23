"use client"

import { useState, useEffect } from "react"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  // Simplified to 2 layout options:
  // A: Full page photo with small margin
  // B: Photo 2/3 + Quote 1/3 (photo can be top or bottom)
  const layouts =
    type === "photo"
      ? [
          {
            value: "A" as PageLayout,
            label: "Full Page Photo",
            description: "With margin",
            preview: (
              <div className="w-full h-16 bg-muted rounded border-2 border-dashed flex items-center justify-center p-2">
                <div className="w-full h-full bg-primary/20 rounded" />
              </div>
            ),
          },
          {
            value: "B" as PageLayout,
            label: "Photo + Quote",
            description: "Photo 2/3, quote 1/3",
            preview: (
              <div className="w-full h-16 bg-muted rounded border-2 border-dashed flex flex-col gap-1 p-1">
                <div className="flex-[2] bg-primary/20 rounded" />
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-foreground/20 rounded" />
                </div>
              </div>
            ),
          },
        ]
      : [
          {
            value: "A" as PageLayout,
            label: "Full Page Quote",
            description: "Centered text",
            preview: (
              <div className="w-full h-16 bg-muted rounded border-2 border-dashed flex items-center justify-center p-2">
                <div className="w-3/4 h-2 bg-primary/20 rounded" />
              </div>
            ),
          },
          {
            value: "B" as PageLayout,
            label: "Photo + Quote",
            description: "Photo 2/3, quote 1/3",
            preview: (
              <div className="w-full h-16 bg-muted rounded border-2 border-dashed flex flex-col gap-1 p-1">
                <div className="flex-[2] bg-primary/20 rounded" />
                <div className="flex-1 bg-secondary/50 rounded flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-foreground/20 rounded" />
                </div>
              </div>
            ),
          },
        ]

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg border-2 border-border animate-pulse bg-muted h-24" />
        <div className="p-2 rounded-lg border-2 border-border animate-pulse bg-muted h-24" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {layouts.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onSelect(selected === layout.value ? null : layout.value)}
          className={cn(
            "p-2 rounded-lg border-2 transition-all text-left",
            selected === layout.value
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="mb-2">{layout.preview}</div>
          <div className="text-xs font-medium leading-tight">{layout.label}</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{layout.description}</div>
        </button>
      ))}
    </div>
  )
}

