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

    return NextResponse.json(photos || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 30, // 30 seconds for large uploads
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

      // For HEIC files, we'll try to upload but note they may not display in browsers
      const isHeic = /\.heic$/i.test(file.name) || file.type.toLowerCase().includes('heic')
      if (isHeic) {
        // HEIC files can be uploaded but browsers can't display them natively
        // We'll upload them but they may need conversion for display
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
        continue // Continue with other files instead of failing completely
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = serviceClient.storage.from("attachments").getPublicUrl(filePath)

      // Get image dimensions (optional, can be done client-side)
      // For now, we'll store null and let the client handle it

      // Save to book_photos table
      const { data: photo, error: photoError } = await supabase
        .from("book_photos")
        .insert({
          book_id: id,
          url: publicUrl,
          filename: filename,
          width: null, // Can be calculated client-side
          height: null,
        })
        .select()
        .single()

      if (photoError) {
        console.error("Photo insert error:", photoError)
        failedUploads.push(`${file.name}: ${photoError.message}`)
        continue // Continue with other files
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

    // Return success with any warnings about failed uploads
    return NextResponse.json({ 
      photos: uploadedPhotos,
      warnings: failedUploads.length > 0 ? failedUploads : undefined
    })
  } catch (error: any) {
    console.error("Photo upload route error:", error)
    // Check if it's a body size limit error
    if (error.message && error.message.includes("body") && error.message.includes("limit")) {
      return NextResponse.json(
        { error: "File too large. Maximum file size is 10MB per file." },
        { status: 413 }
      )
    }
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

    // Get photo to delete file from storage
    const { data: photo, error: photoFetchError } = await supabase
      .from("book_photos")
      .select("url, filename")
      .eq("id", photoId)
      .eq("book_id", id)
      .single()

    if (photoFetchError || !photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      )
    }

    // Delete from storage if filename exists
    if (photo.filename) {
      const serviceClient = await createServiceRoleClient()
      const filePath = `books/${id}/photos/${photo.filename}`
      await serviceClient.storage.from("attachments").remove([filePath])
    }

    // Delete from database
    const { error: deleteError } = await supabase
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

