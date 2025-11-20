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
import type { Entry, Person, BookPhoto } from "@/lib/types"

interface BookAssetsSidebarProps {
  quotes: Entry[]
  photos: BookPhoto[]
  persons: Person[]
  bookId: string
  onPhotosUploaded: (photos: BookPhoto[]) => void
}

export default function BookAssetsSidebar({
  quotes,
  photos,
  persons,
  bookId,
  onPhotosUploaded,
}: BookAssetsSidebarProps) {
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("all")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const filteredQuotes =
    selectedPersonFilter === "all"
      ? quotes
      : quotes.filter((q) => q.said_by === selectedPersonFilter)

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col overflow-hidden">
      {/* Quotes Section */}
      <div className="flex-1 flex flex-col overflow-hidden border-b">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Quotes</h3>
          </div>
          <Select
            value={selectedPersonFilter}
            onValueChange={setSelectedPersonFilter}
          >
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

      {/* Photos Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          <BookPhotoCarousel photos={photos} />
        </div>
      </div>

      {/* Photo Upload Modal */}
      <BookPhotoUpload
        bookId={bookId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={onPhotosUploaded}
      />
    </div>
  )
}

