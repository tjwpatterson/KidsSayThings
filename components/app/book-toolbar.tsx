"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Undo2, Redo2, Cloud, Share2, Sparkles, ZoomIn, ZoomOut, Maximize2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Book } from "@/lib/types"

interface BookToolbarProps {
  book: Book
  onUpdate: (updates: Partial<Book>) => Promise<void>
  onAutoGenerate: () => Promise<void>
  saving?: boolean
  zoom?: number
  onZoomChange?: (zoom: number) => void
}

export default function BookToolbar({
  book,
  onUpdate,
  onAutoGenerate,
  saving = false,
  zoom = 100,
  onZoomChange,
}: BookToolbarProps) {
  const [title, setTitle] = useState(book.title || "")
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
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
      {/* Left side - Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-muted transition-colors" 
          disabled
          title="Undo (Coming soon)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-muted transition-colors" 
          disabled
          title="Redo (Coming soon)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
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
          <div className="flex items-center gap-0.5 border-r pr-3 mr-3">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-muted transition-colors"
              disabled={zoom <= 50}
              title="Zoom Out (⌘-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomReset}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs font-medium hover:bg-muted transition-colors"
              title="Reset Zoom"
            >
              {zoom}%
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-muted transition-colors"
              disabled={zoom >= 200}
              title="Zoom In (⌘+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomFit}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-muted transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {saving ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Cloud className="h-4 w-4" />
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 transition-colors">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Saved</span>
          </div>
        )}
        <Button
          onClick={onAutoGenerate}
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-muted transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Generate
        </Button>
        <Button 
          onClick={handleShare} 
          variant="default" 
          size="sm" 
          className="gap-2 hover:bg-primary/90 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
