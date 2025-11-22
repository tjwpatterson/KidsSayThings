import { redirect } from "next/navigation"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import BookDesigner from "@/components/app/book-designer"
import type { Book, Entry, Person, BookPhoto, BookPage } from "@/lib/types"

export default async function BookDesignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const household = await getCurrentHousehold()

  if (!household) {
    redirect("/app/onboarding")
  }

  // Fetch book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .single()

  if (bookError || !book) {
    redirect("/app/books")
  }

  // Fetch entries (quotes) for the date range
  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("*")
    .eq("household_id", household.id)
    .eq("entry_type", "quote")
    .gte("entry_date", book.date_start)
    .lte("entry_date", book.date_end)
    .order("entry_date", { ascending: true })

  // Fetch persons for filtering
  const { data: persons, error: personsError } = await supabase
    .from("persons")
    .select("*")
    .eq("household_id", household.id)
    .order("display_name", { ascending: true })

  // Fetch existing book pages
  let pages: BookPage[] = []
  const { data: pagesData, error: pagesError } = await supabase
    .from("book_pages")
    .select("*")
    .eq("book_id", id)
    .order("page_number", { ascending: true })

  if (!pagesError && pagesData) {
    pages = pagesData.map((page) => ({
      ...page,
      left_content: (page.left_content as any) || [],
      right_content: (page.right_content as any) || [],
    })) as BookPage[]
  }

  // Fetch book photos
  const { data: photos, error: photosError } = await supabase
    .from("book_photos")
    .select("*")
    .eq("book_id", id)
    .order("created_at", { ascending: false })

  // Generate signed URLs for photos (bucket is private)
  let photosWithSignedUrls: BookPhoto[] = []
  if (photos && photos.length > 0) {
    const serviceClient = await createServiceRoleClient()
    photosWithSignedUrls = await Promise.all(
      photos.map(async (photo: any) => {
        // Extract file path from URL or use filename
        let filePath = photo.url
        if (photo.url && photo.url.includes("/attachments/")) {
          const parts = photo.url.split("/attachments/")
          filePath = parts[1] || photo.filename || ""
        } else if (photo.filename) {
          filePath = `books/${id}/photos/${photo.filename}`
        }

        // Generate signed URL (valid for 1 hour)
        const { data: signedData, error: signedError } = await serviceClient.storage
          .from("attachments")
          .createSignedUrl(filePath, 3600)

        if (signedError || !signedData?.signedUrl) {
          console.error("Error creating signed URL:", signedError, { photo, filePath })
          return { ...photo, url: photo.url } // Fallback to original URL
        }

        return {
          ...photo,
          url: signedData.signedUrl,
        }
      })
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <BookDesigner
        book={book as Book}
        initialEntries={(entries as Entry[]) || []}
        initialPersons={(persons as Person[]) || []}
        initialPages={pages || []}
        initialPhotos={photosWithSignedUrls || []}
      />
    </div>
  )
}

