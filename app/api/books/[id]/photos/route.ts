import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const household = await getCurrentHousehold()
    if (!household) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 404 }
      )
    }

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    // Fetch all photos for this book
    const { data: photos, error: photosError } = await supabase
      .from("book_photos")
      .select("*")
      .eq("book_id", id)
      .order("created_at", { ascending: false })

    if (photosError) throw photosError

    // Generate signed URLs for each photo (bucket is private)
    const serviceClient = await createServiceRoleClient()
    const photosWithSignedUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        // Extract file path from URL or reconstruct it
        // URL format: https://[project].supabase.co/storage/v1/object/public/attachments/books/[id]/photos/[filename]
        // We need: books/[id]/photos/[filename]
        let filePath = photo.url
        if (photo.url.includes("/attachments/")) {
          const parts = photo.url.split("/attachments/")
          filePath = parts[1] || photo.filename || ""
        } else if (photo.filename) {
          // Reconstruct path from filename
          filePath = `books/${id}/photos/${photo.filename}`
        }

        // Generate signed URL (valid for 1 hour)
        const { data: signedData, error: signedError } = await serviceClient.storage
          .from("attachments")
          .createSignedUrl(filePath, 3600)

        if (signedError) {
          console.error("Error creating signed URL for photo:", signedError, { photo, filePath })
          return { ...photo, signed_url: photo.url } // Fallback to original URL
        }

        return {
          ...photo,
          url: signedData?.signedUrl || photo.url, // Use signed URL
        }
      })
    )

    return NextResponse.json(photosWithSignedUrls || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const household = await getCurrentHousehold()
    if (!household) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 404 }
      )
    }

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    // Check if this is a request for signed upload URL or metadata save
    const contentType = request.headers.get("content-type") || ""
    const urlParams = new URL(request.url).searchParams
    const action = urlParams.get("action")
    
    if (action === "get-upload-url") {
      // Generate signed upload URL for client
      const { filename } = await request.json()
      
      if (!filename) {
        return NextResponse.json(
          { error: "Filename is required" },
          { status: 400 }
        )
      }

      const filePath = `books/${id}/photos/${filename}`
      const serviceClient = await createServiceRoleClient()
      
      // Create signed upload URL (valid for 1 hour)
      const { data: signedData, error: signedError } = await serviceClient.storage
        .from("attachments")
        .createSignedUploadUrl(filePath, {
          upsert: false,
        })

      if (signedError) {
        console.error("Error creating signed upload URL:", signedError)
        return NextResponse.json(
          { error: `Failed to create upload URL: ${signedError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        path: filePath,
      })
    } else if (contentType.includes("application/json")) {
      // Save metadata after upload (from signed URL upload)
      const body = await request.json()
      const { url, filename, path } = body

      if (!url || !filename) {
        return NextResponse.json(
          { error: "URL and filename are required" },
          { status: 400 }
        )
      }

      // We've already verified:
      // 1. User is authenticated (checked above)
      // 2. Book belongs to user's household (checked above)
      // Use authenticated client - RLS policy will allow since user is household member
      const { data: photo, error: photoError } = await supabase
        .from("book_photos")
        .insert({
          book_id: id,
          url: url,
          filename: filename,
          width: null,
          height: null,
        })
        .select()
        .single()

      if (photoError) {
        console.error("Photo insert error:", photoError)
        return NextResponse.json(
          { error: `Failed to save photo: ${photoError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ photo })
    } else {
      // Legacy FormData approach (kept for backwards compatibility)
      let formData: FormData
      try {
        formData = await request.formData()
      } catch (error: any) {
        return NextResponse.json(
          { error: "Failed to parse form data. File may be too large (max 10MB per file)." },
          { status: 400 }
        )
      }

      const files = formData.getAll("files") as File[]

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files provided" },
          { status: 400 }
        )
      }

      // Validate files before processing
      const maxSize = 10 * 1024 * 1024 // 10MB
      const invalidFiles: string[] = []
      
      files.forEach((file) => {
        if (file.size > maxSize) {
          invalidFiles.push(`${file.name} (${Math.round(file.size / 1024 / 1024)}MB, max 10MB)`)
        }
      })

      if (invalidFiles.length > 0) {
        return NextResponse.json(
          { error: `Files too large: ${invalidFiles.join(', ')}` },
          { status: 400 }
        )
      }

      const serviceClient = await createServiceRoleClient()
      const uploadedPhotos = []
      const failedUploads: string[] = []

      for (const file of files) {
        // Check if it's an image type (including HEIC by extension)
        const isImageType = file.type.startsWith("image/")
        const isImageExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name)
        
        if (!isImageType && !isImageExtension) {
          failedUploads.push(`${file.name} (unsupported format)`)
          continue
        }

        // Generate filename
        const timestamp = Date.now()
        const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filePath = `books/${id}/photos/${filename}`

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await serviceClient.storage
          .from("attachments")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          failedUploads.push(`${file.name}: ${uploadError.message}`)
          continue
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = serviceClient.storage.from("attachments").getPublicUrl(filePath)

        // Save to book_photos table
        const { data: photo, error: photoError } = await supabase
          .from("book_photos")
          .insert({
            book_id: id,
            url: publicUrl,
            filename: filename,
            width: null,
            height: null,
          })
          .select()
          .single()

        if (photoError) {
          console.error("Photo insert error:", photoError)
          failedUploads.push(`${file.name}: ${photoError.message}`)
          continue
        }

        uploadedPhotos.push(photo)
      }

      if (uploadedPhotos.length === 0) {
        return NextResponse.json(
          { 
            error: "No photos were uploaded successfully",
            failedUploads: failedUploads.length > 0 ? failedUploads : undefined
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        photos: uploadedPhotos,
        warnings: failedUploads.length > 0 ? failedUploads : undefined
      })
    }
  } catch (error: any) {
    console.error("Photo upload route error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload photos. Please try again." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const household = await getCurrentHousehold()
    if (!household) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("photo_id")

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      )
    }

    console.log("DELETE photo request:", { bookId: id, photoId, userId: user.id })

    // Verify book belongs to household
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      console.error("Book verification failed:", { bookError, bookId: id, householdId: household.id })
      return NextResponse.json(
        { error: "Book not found or not authorized" },
        { status: 404 }
      )
    }

    console.log("Book verified, checking photo:", { photoId, bookId: id })

    // Use service role client to bypass RLS since we've already verified authorization
    // This ensures we can delete photos even if RLS policies have edge cases
    const serviceClient = await createServiceRoleClient()
    
    // Get photo to delete file from storage
    const { data: photo, error: photoFetchError } = await serviceClient
      .from("book_photos")
      .select("id, book_id, url, filename, path")
      .eq("id", photoId)
      .eq("book_id", id)
      .single()

    console.log("Photo lookup result:", { 
      photo, 
      photoFetchError, 
      photoId, 
      bookId: id,
      errorCode: photoFetchError?.code,
      errorMessage: photoFetchError?.message,
      errorDetails: photoFetchError?.details
    })

    if (photoFetchError || !photo) {
      // If photo not found with book_id filter, check if it exists at all
      const { data: photoAny, error: errorAny } = await serviceClient
        .from("book_photos")
        .select("id, book_id, filename")
        .eq("id", photoId)
        .single()
      
      if (photoAny && !errorAny) {
        if (photoAny.book_id !== id) {
          console.error("Photo exists but belongs to different book:", {
            photoId,
            requestedBookId: id,
            actualBookId: photoAny.book_id
          })
          return NextResponse.json(
            { error: `Photo not found in this book. Photo belongs to book ${photoAny.book_id}` },
            { status: 404 }
          )
        }
      }
      
      return NextResponse.json(
        { error: `Photo not found. PhotoId: ${photoId}, BookId: ${id}, Error: ${photoFetchError?.message || 'No photo found'}` },
        { status: 404 }
      )
    }

    // Delete from storage if path or filename exists
    if (photo.path || photo.filename) {
      // Prefer path if available, otherwise construct from filename
      const filePath = photo.path || `books/${id}/photos/${photo.filename}`
      await serviceClient.storage.from("attachments").remove([filePath])
    }

    // Delete from database using service role client (we've already verified authorization)
    const { error: deleteError } = await serviceClient
      .from("book_photos")
      .delete()
      .eq("id", photoId)
      .eq("book_id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete photo" },
      { status: 500 }
    )
  }
}

