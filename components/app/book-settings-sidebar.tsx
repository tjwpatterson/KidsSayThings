"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ThemePreviewCard from "./theme-preview-card"
import CoverStylePreview from "./cover-style-preview"
import type { BookThemeConfig, Book } from "@/lib/types"

const themes: BookThemeConfig[] = [
  {
    id: "classic",
    name: "Classic",
    colors: {
      primary: "hsl(14, 90%, 58%)",
      secondary: "hsl(45, 93%, 94%)",
      accent: "hsl(14, 90%, 95%)",
      text: "hsl(240, 10%, 15%)",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Georgia",
    },
  },
  {
    id: "playful",
    name: "Playful",
    colors: {
      primary: "hsl(14, 90%, 58%)",
      secondary: "hsl(45, 93%, 94%)",
      accent: "hsl(14, 90%, 95%)",
      text: "hsl(240, 10%, 15%)",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
  {
    id: "modern",
    name: "Modern",
    colors: {
      primary: "hsl(220, 70%, 50%)",
      secondary: "hsl(220, 30%, 95%)",
      accent: "hsl(220, 50%, 90%)",
      text: "hsl(220, 20%, 20%)",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
]

interface BookSettingsSidebarProps {
  book: Book
  onUpdate: (updates: Partial<Book>) => Promise<void>
}

export default function BookSettingsSidebar({
  book,
  onUpdate,
}: BookSettingsSidebarProps) {
  const [dedication, setDedication] = useState(book.dedication || "")

  const handleThemeChange = async (themeId: string) => {
    await onUpdate({ theme: themeId as "classic" | "playful" })
  }

  const handleCoverStyleChange = async (style: "linen" | "solid" | "gradient") => {
    await onUpdate({ cover_style: style })
  }

  const handleDedicationChange = async (value: string) => {
    setDedication(value)
    await onUpdate({ dedication: value || null })
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Theme Selector */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Theme</Label>
          <div className="space-y-2">
            {themes.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isSelected={book.theme === theme.id}
                onClick={() => handleThemeChange(theme.id)}
              />
            ))}
          </div>
        </div>

        {/* Cover Style */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Cover Style</Label>
          <div className="space-y-2">
            {(["linen", "solid", "gradient"] as const).map((style) => (
              <CoverStylePreview
                key={style}
                style={style}
                isSelected={book.cover_style === style}
                onClick={() => handleCoverStyleChange(style)}
              />
            ))}
          </div>
        </div>

        {/* Dedication */}
        <div>
          <Label htmlFor="dedication" className="text-sm font-semibold mb-3 block">
            Dedication
          </Label>
          <Textarea
            id="dedication"
            placeholder="For our wonderful family..."
            value={dedication}
            onChange={(e) => handleDedicationChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Optional dedication text for your book
          </p>
        </div>
      </div>
    </div>
  )
}

