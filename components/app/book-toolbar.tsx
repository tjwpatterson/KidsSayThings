"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Undo2, Redo2, Cloud, Share2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Book } from "@/lib/types"

interface BookToolbarProps {
  book: Book
  onUpdate: (updates: Partial<Book>) => Promise<void>
  onAutoGenerate: () => Promise<void>
  saving?: boolean
}

export default function BookToolbar({
  book,
  onUpdate,
  onAutoGenerate,
  saving = false,
}: BookToolbarProps) {
  const [title, setTitle] = useState(book.title || "")
  const { toast } = useToast()

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
      {/* Left side - Undo/Redo */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
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

      {/* Right side - Save status, Auto-generate, Share */}
      <div className="flex items-center gap-2">
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
