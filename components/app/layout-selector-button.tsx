"use client"

import { useEffect, useRef, useState } from "react"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import BookLayoutSelectorVisual from "./book-layout-selector-visual"
import type { PageLayout } from "@/lib/types"

interface LayoutSelectorButtonProps {
  layout: PageLayout | null
  onLayoutChange: (layout: PageLayout | null) => void
}

export default function LayoutSelectorButton({
  layout,
  onLayoutChange,
}: LayoutSelectorButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        overlayRef.current &&
        triggerRef.current &&
        !overlayRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  if (!mounted) {
    return (
      <Button variant="default" size="sm" className="gap-2" disabled>
        <LayoutGrid className="h-4 w-4" />
        Choose Page Layout
      </Button>
    )
  }

  const buttonLabel = layout ? (layout === "A" ? "Full Page" : "Photo + Quote") : "Choose Page Layout"

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={triggerRef}
        variant={layout ? "outline" : "default"}
        size="sm"
        className={
          layout
            ? "gap-2 bg-background/95 backdrop-blur-sm hover:bg-background transition-all shadow-md hover:shadow-lg border-2"
            : "gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        }
        onClick={() => setOpen((prev) => !prev)}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="text-xs font-medium">{buttonLabel}</span>
      </Button>

      {open && (
        <div
          ref={overlayRef}
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-popover p-4 shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">
                  {layout ? "Page Layout" : "Choose Page Layout"}
                </h4>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
              <BookLayoutSelectorVisual
                selected={layout}
                onSelect={(newLayout) => {
                  try {
                    onLayoutChange(newLayout)
                    setOpen(false)
                  } catch (error) {
                    console.error("Error changing layout:", error)
                  }
                }}
                type="photo"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

