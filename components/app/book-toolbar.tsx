"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Undo2, Redo2, Cloud, Share2, Sparkles, ZoomIn, ZoomOut, Maximize2, Layout } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import BookLayoutSelectorVisual from "./book-layout-selector-visual"
import type { Book, PageLayout } from "@/lib/types"

interface BookToolbarProps {
  book: Book
  onUpdate: (updates: Partial<Book>) => Promise<void>
  onAutoGenerate: () => Promise<void>
  saving?: boolean
  zoom?: number
  onZoomChange?: (zoom: number) => void
  leftLayout?: PageLayout | null
  rightLayout?: PageLayout | null
  onLeftLayoutChange?: (layout: PageLayout | null) => void
  onRightLayoutChange?: (layout: PageLayout | null) => void
}

export default function BookToolbar({
  book,
  onUpdate,
  onAutoGenerate,
  saving = false,
  zoom = 100,
  onZoomChange,
  leftLayout,
  rightLayout,
  onLeftLayoutChange,
  onRightLayoutChange,
}: BookToolbarProps) {
  const [title, setTitle] = useState(book.title || "")
  const [layoutPopoverOpen, setLayoutPopoverOpen] = useState(false)
  const { toast } = useToast()

  const handleZoomIn = () => {
    if (onZoomChange) {
      const newZoom = Math.min(zoom + 25, 200) // Max 200%
      onZoomChange(newZoom)
    }
  }

  const handleZoomOut = () => {
    if (onZoomChange) {
      const newZoom = Math.max(zoom - 25, 50) // Min 50%
      onZoomChange(newZoom)
    }
  }

  const handleZoomReset = () => {
    if (onZoomChange) {
      onZoomChange(100)
    }
  }

  const handleZoomFit = () => {
    if (onZoomChange) {
      onZoomChange(100) // Reset to fit
    }
  }

  const handleTitleChange = async (value: string) => {
    setTitle(value)
    await onUpdate({ title: value || null })
  }

  const handleShare = () => {
    toast({
      title: "Share",
      description: "Share functionality coming soon!",
    })
  }

  return (
    <div className="border-b bg-background px-4 py-2 flex items-center justify-between gap-4">
      {/* Left side - Undo/Redo, Layouts */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <Redo2 className="h-4 w-4" />
        </Button>
        
        {/* Layout Selector Popover */}
        {onLeftLayoutChange && onRightLayoutChange && (
          <Popover open={layoutPopoverOpen} onOpenChange={setLayoutPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Layout className="h-4 w-4" />
                Layouts
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Left Page Layout</h4>
                  <BookLayoutSelectorVisual
                    selected={leftLayout || null}
                    onSelect={onLeftLayoutChange}
                    type="photo"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Right Page Layout</h4>
                  <BookLayoutSelectorVisual
                    selected={rightLayout || null}
                    onSelect={onRightLayoutChange}
                    type="quote"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Center - Book Title */}
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Untitled Book"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="border-0 bg-transparent text-base font-medium px-2 focus-visible:ring-1 focus-visible:ring-offset-0 text-center"
        />
      </div>

      {/* Right side - Zoom controls, Save status, Auto-generate, Share */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        {onZoomChange && (
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={zoom <= 50}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomReset}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              title="Reset Zoom"
            >
              {zoom}%
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={zoom >= 200}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomFit}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {saving ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4 animate-pulse" />
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>Saved</span>
          </div>
        )}
        <Button
          onClick={onAutoGenerate}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Generate
        </Button>
        <Button onClick={handleShare} variant="default" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
