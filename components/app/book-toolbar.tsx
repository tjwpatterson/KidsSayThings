"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Save } from "lucide-react"
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
  const [dateStart, setDateStart] = useState(book.date_start)
  const [dateEnd, setDateEnd] = useState(book.date_end)
  const [size, setSize] = useState(book.size)
  const { toast } = useToast()

  const handleTitleChange = async (value: string) => {
    setTitle(value)
    await onUpdate({ title: value || null })
  }

  const handleDateStartChange = async (value: string) => {
    setDateStart(value)
    await onUpdate({ date_start: value })
  }

  const handleDateEndChange = async (value: string) => {
    setDateEnd(value)
    await onUpdate({ date_end: value })
  }

  const handleSizeChange = async (value: "6x9" | "8x10") => {
    setSize(value)
    await onUpdate({ size: value })
  }

  const handleAutoGenerate = async () => {
    try {
      await onAutoGenerate()
      toast({
        title: "Book generated!",
        description: "Your book has been auto-generated. You can now customize it.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate book",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="border-b bg-background px-6 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Book Title */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Book Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-0 bg-transparent text-lg font-semibold px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Label htmlFor="date_start" className="text-sm text-muted-foreground whitespace-nowrap">
            From
          </Label>
          <Input
            id="date_start"
            type="date"
            value={dateStart}
            onChange={(e) => handleDateStartChange(e.target.value)}
            className="w-[140px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="date_end" className="text-sm text-muted-foreground whitespace-nowrap">
            To
          </Label>
          <Input
            id="date_end"
            type="date"
            value={dateEnd}
            onChange={(e) => handleDateEndChange(e.target.value)}
            className="w-[140px]"
          />
        </div>

        {/* Size Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="size" className="text-sm text-muted-foreground whitespace-nowrap">
            Size
          </Label>
          <Select value={size} onValueChange={handleSizeChange}>
            <SelectTrigger id="size" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6x9">6" × 9"</SelectItem>
              <SelectItem value="8x10">8" × 10"</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Generate Button */}
        <Button
          onClick={handleAutoGenerate}
          className="gap-2"
          variant="default"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Generate
        </Button>

        {/* Saving Indicator */}
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Save className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}

