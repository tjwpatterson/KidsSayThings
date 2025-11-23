"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Book, Entry, Person, BookPhoto, BookPage } from "@/lib/types"

export default function BookDesignPageClient() {
  const params = useParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [BookDesignerWrapper, setBookDesignerWrapper] = useState<React.ComponentType<{
    book: Book
    initialEntries: Entry[]
    initialPersons: Person[]
    initialPages: BookPage[]
    initialPhotos: BookPhoto[]
  }> | null>(null)
  const [data, setData] = useState<{
    book: Book | null
    entries: Entry[]
    persons: Person[]
    pages: BookPage[]
    photos: BookPhoto[]
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    // Dynamically import BookDesignerWrapper only after mount
    import("./book-designer-wrapper").then((mod) => {
      setBookDesignerWrapper(() => mod.default)
    }).catch((error) => {
      console.error("Failed to load BookDesignerWrapper:", error)
    })
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadData = async () => {
      try {
        const id = params?.id as string

        if (!id) {
          console.error("No book ID in params")
          router.push("/app/books")
          return
        }

        const supabase = createClient()

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error("Auth error:", authError)
          router.push("/login")
          return
        }

        if (!user) {
          router.push("/login")
          return
        }

        // Get household
        const { data: membership } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single()

        if (!membership) {
          router.push("/app/onboarding")
          return
        }

        // Fetch book
        const { data: book, error: bookError } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .eq("household_id", membership.household_id)
          .single()

        if (bookError || !book) {
          router.push("/app/books")
          return
        }

        // Fetch entries
        const { data: entries } = await supabase
          .from("entries")
          .select("*")
          .eq("household_id", membership.household_id)
          .eq("entry_type", "quote")
          .gte("entry_date", book.date_start)
          .lte("entry_date", book.date_end)
          .order("entry_date", { ascending: true })

        // Fetch persons
        const { data: persons } = await supabase
          .from("persons")
          .select("*")
          .eq("household_id", membership.household_id)
          .order("display_name", { ascending: true })

        // Fetch pages
        const { data: pagesData } = await supabase
          .from("book_pages")
          .select("*")
          .eq("book_id", id)
          .order("page_number", { ascending: true })

        const pages: BookPage[] =
          pagesData?.map((page) => ({
            ...page,
            left_content: (page.left_content as any) || [],
            right_content: [],
          })) || []

        // Fetch photos and generate signed URLs
        const { data: photos } = await supabase
          .from("book_photos")
          .select("*")
          .eq("book_id", id)
          .order("created_at", { ascending: false })

        // Generate signed URLs for photos
        let photosWithSignedUrls: BookPhoto[] = []
        if (photos && photos.length > 0) {
          try {
            // Use API route to get signed URLs
            const res = await fetch(`/api/books/${id}/photos`)
            if (res.ok) {
              const signedUrls = await res.json()
              photosWithSignedUrls = signedUrls || photos
            } else {
              console.warn("Failed to get signed URLs, using original URLs")
              photosWithSignedUrls = photos
            }
          } catch (error) {
            console.error("Error fetching signed URLs:", error)
            photosWithSignedUrls = photos // Fallback to original URLs
          }
        }

        setData({
          book: book as Book,
          entries: (entries as Entry[]) || [],
          persons: (persons as Person[]) || [],
          pages: pages || [],
          photos: photosWithSignedUrls || [],
        })
      } catch (error) {
        console.error("Error loading book data:", error)
        router.push("/app/books")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [mounted, params?.id, router])

  // Don't render ANYTHING until mounted AND component is loaded AND data is ready
  // Return null on server AND during initial mount to prevent any hydration mismatch
  if (typeof window === "undefined" || !mounted) {
    return null
  }

  if (loading || !data || !data.book || !BookDesignerWrapper) {
    return (
      <div className="h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book designer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" suppressHydrationWarning>
      <BookDesignerWrapper
        book={data.book}
        initialEntries={data.entries}
        initialPersons={data.persons}
        initialPages={data.pages}
        initialPhotos={data.photos}
      />
    </div>
  )
}

