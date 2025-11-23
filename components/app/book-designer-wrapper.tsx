"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Book, Entry, Person, BookPhoto, BookPage } from "@/lib/types"

// Dynamically import BookDesignerClient with SSR completely disabled
const BookDesignerClient = dynamic(
  () => import("./book-designer-client"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book designer...</p>
        </div>
      </div>
    ),
  }
)

interface BookDesignerWrapperProps {
  book: Book
  initialEntries: Entry[]
  initialPersons: Person[]
  initialPages: BookPage[]
  initialPhotos: BookPhoto[]
}

export default function BookDesignerWrapper(props: BookDesignerWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book designer...</p>
        </div>
      </div>
    )
  }

  return <BookDesignerClient {...props} />
}

