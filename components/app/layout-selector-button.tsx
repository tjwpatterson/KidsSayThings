"use client"

import { useState, useEffect } from "react"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="default" size="sm" className="gap-2" disabled>
        <LayoutGrid className="h-4 w-4" />
        Choose Page Layout
      </Button>
    )
  }

  return (
    <>
      {layout ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-background/95 backdrop-blur-sm hover:bg-background transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-xs font-medium">
                {layout === "A" ? "Full Page" : "Photo + Quote"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Page Layout</h4>
                <BookLayoutSelectorVisual
                  selected={layout}
                  onSelect={(newLayout) => {
                    try {
                      onLayoutChange(newLayout)
                    } catch (error) {
                      console.error("Error changing layout:", error)
                    }
                  }}
                  type="photo"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="gap-2 hover:bg-primary/90 transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              Choose Page Layout
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Choose Page Layout</h4>
                <BookLayoutSelectorVisual
                  selected={null}
                  onSelect={(newLayout) => {
                    try {
                      onLayoutChange(newLayout)
                    } catch (error) {
                      console.error("Error changing layout:", error)
                    }
                  }}
                  type="photo"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}

