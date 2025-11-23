"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Book, Entry, Person, BookPhoto, BookPage } from "@/lib/types"

interface BookDesignerWrapperProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

export default function BookDesignerWrapper(props: BookDesignerWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [BookDesignerClient, setBookDesignerClient] = useState<React.ComponentType<BookDesignerWrapperProps> | null>(null)

  useEffect(() => {
    setMounted(true)
    // Dynamically import only after mount
    import("./book-designer-client").then((mod) => {
      setBookDesignerClient(() => mod.default)
    })
  }, [])

  // Don't render ANYTHING until mounted AND component is loaded
  // Return null on server AND during initial mount to prevent any hydration mismatch
  if (typeof window === "undefined" || !mounted) {
    return null
  }

  if (!BookDesignerClient) {
    return (
      <div className="h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book designer...</p>
        </div>
      </div>
    )
  }

  return <BookDesignerClient {...props} />
}

