"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload } from "lucide-react"
import BookPhotoCarousel from "./book-photo-carousel"
import BookQuoteCarousel from "./book-quote-carousel"
import BookPhotoUpload from "./book-photo-upload"
import BookLayoutSelectorVisual from "./book-layout-selector-visual"
import ThemePreviewCard from "./theme-preview-card"
import CoverStylePreview from "./cover-style-preview"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Entry, Person, BookPhoto, BookThemeConfig, Book, PageLayout } from "@/lib/types"

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

type SidebarTab = "photos" | "quotes" | "layouts" | "theme" | "settings"

interface BookSidebarContentProps {
  activeTab: SidebarTab
  quotes: Entry[]
  photos: BookPhoto[]
  persons: Person[]
  book: Book
  bookId: string
  selectedPersonFilter: string
  onPersonFilterChange: (personId: string) => void
  onPhotosUploaded: (photos: BookPhoto[]) => void
  onBookUpdate: (updates: Partial<Book>) => Promise<void>
  leftLayout?: PageLayout | null
  rightLayout?: PageLayout | null
  onLeftLayoutChange?: (layout: PageLayout | null) => void
  onRightLayoutChange?: (layout: PageLayout | null) => void
}

export default function BookSidebarContent({
  activeTab,
  quotes,
  photos,
  persons,
  book,
  bookId,
  selectedPersonFilter,
  onPersonFilterChange,
  onPhotosUploaded,
  onBookUpdate,
  leftLayout,
  rightLayout,
  onLeftLayoutChange,
  onRightLayoutChange,
}: BookSidebarContentProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [dedication, setDedication] = useState(book.dedication || "")

  const filteredQuotes =
    selectedPersonFilter === "all"
      ? quotes
      : quotes.filter((q) => q.said_by === selectedPersonFilter)

  const handleThemeChange = async (themeId: string) => {
    await onBookUpdate({ theme: themeId as "classic" | "playful" })
  }

  const handleCoverStyleChange = async (style: "linen" | "solid" | "gradient") => {
    await onBookUpdate({ cover_style: style })
  }

  const handleDedicationChange = async (value: string) => {
    setDedication(value)
    await onBookUpdate({ dedication: value || null })
  }

  if (activeTab === "photos") {
    return (
      <div className="flex-1 border-r bg-muted/30 flex flex-col overflow-hidden min-w-[200px]">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Photos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <BookPhotoCarousel 
            photos={photos} 
            bookId={bookId}
            onPhotoDeleted={async () => {
              // Reload photos from server after deletion
              try {
                const res = await fetch(`/api/books/${bookId}/photos`)
                if (res.ok) {
                  const reloadedPhotos = await res.json()
                  // Trigger parent to refresh photos
                  if (onPhotosUploaded) {
                    onPhotosUploaded(reloadedPhotos)
                  }
                }
              } catch (error) {
                console.error("Error reloading photos after deletion:", error)
              }
            }}
          />
        </div>
        <BookPhotoUpload
          bookId={bookId}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={onPhotosUploaded}
        />
      </div>
    )
  }

  if (activeTab === "quotes") {
    return (
      <div className="flex-1 border-r bg-muted/30 flex flex-col overflow-hidden min-w-[200px]">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Quotes</h3>
          </div>
          <Select value={selectedPersonFilter} onValueChange={onPersonFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto">
          <BookQuoteCarousel quotes={filteredQuotes} persons={persons} />
        </div>
      </div>
    )
  }

  if (activeTab === "layouts") {
    return (
      <div className="flex-1 border-r bg-muted/30 flex flex-col overflow-y-auto min-w-[200px]">
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Left Page Layout</h3>
            {onLeftLayoutChange ? (
              <BookLayoutSelectorVisual
                selected={leftLayout || null}
                onSelect={onLeftLayoutChange}
                type="photo"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Layout controls not available</div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Right Page Layout</h3>
            {onRightLayoutChange ? (
              <BookLayoutSelectorVisual
                selected={rightLayout || null}
                onSelect={onRightLayoutChange}
                type="quote"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Layout controls not available</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === "theme") {
    return (
      <div className="flex-1 border-r bg-muted/30 flex flex-col overflow-y-auto min-w-[200px]">
        <div className="p-4 space-y-6">
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
        </div>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="flex-1 border-r bg-muted/30 flex flex-col overflow-y-auto min-w-[200px]">
        <div className="p-4 space-y-6">
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

  return null
}

