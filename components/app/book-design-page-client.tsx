"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import BookDesignerWrapper from "./book-designer-wrapper"
import type { Book, Entry, Person, BookPhoto, BookPage } from "@/lib/types"

export default function BookDesignPageClient() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    book: Book | null
    entries: Entry[]
    persons: Person[]
    pages: BookPage[]
    photos: BookPhoto[]
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadData = async () => {
      try {
        const id = params.id as string

        const {
          data: { user },
        } = await supabase.auth.getUser()

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
          // Use service role client for signed URLs
          const { data: signedUrls } = await fetch(`/api/books/${id}/photos`).then((r) =>
            r.json()
          )
          photosWithSignedUrls = signedUrls || photos
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
  }, [mounted, params.id, router, supabase])

  if (!mounted || loading || !data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book designer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <BookDesignerWrapper
        book={data.book!}
        initialEntries={data.entries}
        initialPersons={data.persons}
        initialPages={data.pages}
        initialPhotos={data.photos}
      />
    </div>
  )
}

