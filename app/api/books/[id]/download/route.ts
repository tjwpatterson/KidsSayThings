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

    // Get book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .eq("household_id", household.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      )
    }

    if (!book.pdf_url) {
      return NextResponse.json(
        { error: "PDF not available" },
        { status: 404 }
      )
    }

    // Generate signed URL (valid for 1 hour)
    const serviceClient = await createServiceRoleClient()
    
    // Extract file path from the public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/attachments/books/[id]/[timestamp].pdf
    // We need: books/[id]/[timestamp].pdf
    const urlParts = book.pdf_url.split("/")
    const attachmentsIndex = urlParts.findIndex((part) => part === "attachments")
    
    if (attachmentsIndex === -1) {
      // If we can't find "attachments" in the URL, it might be a signed URL already
      // or the URL format is different. Try using it directly.
      console.warn("Could not extract file path from URL:", book.pdf_url)
      return NextResponse.json({ url: book.pdf_url })
    }
    
    // Get path after "attachments/"
    // Example: ["https:", "", "[project].supabase.co", "storage", "v1", "object", "public", "attachments", "books", "[id]", "[timestamp].pdf"]
    // We want: "books/[id]/[timestamp].pdf"
    const fileName = urlParts.slice(attachmentsIndex + 1).join("/")
    
    console.log("Extracted file path:", fileName)
    console.log("Full PDF URL:", book.pdf_url)
    
    // Try to create a signed URL
    const { data, error } = await serviceClient.storage
      .from("attachments")
      .createSignedUrl(fileName, 3600)

    if (error) {
      console.error("Error creating signed URL:", {
        error: error.message,
        fileName,
        pdfUrl: book.pdf_url,
      })
      
      // If creating signed URL fails, try using the public URL directly
      // This works if the bucket is public
      if (book.pdf_url.includes("/public/")) {
        console.log("Falling back to public URL")
        return NextResponse.json({ url: book.pdf_url })
      }
      
      return NextResponse.json(
        { error: `Failed to generate download URL: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || !data.signedUrl) {
      console.error("No signed URL returned from Supabase")
      // Fallback to public URL if available
      if (book.pdf_url.includes("/public/")) {
        return NextResponse.json({ url: book.pdf_url })
      }
      return NextResponse.json(
        { error: "Failed to generate download URL: No signed URL returned" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get download URL" },
      { status: 500 }
    )
  }
}



