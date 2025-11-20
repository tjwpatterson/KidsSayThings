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

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    const serviceClient = await createServiceRoleClient()
    const uploadedPhotos = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue // Skip non-image files
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
        // Return more detailed error
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          { status: 500 }
        )
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
        // Return more detailed error
        return NextResponse.json(
          { error: `Failed to save photo ${file.name}: ${photoError.message}` },
          { status: 500 }
        )
      }

      uploadedPhotos.push(photo)
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { error: "No photos were uploaded successfully" },
        { status: 400 }
      )
    }

    return NextResponse.json({ photos: uploadedPhotos })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload photos" },
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

