import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"

export async function PATCH(
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

    const body = await request.json()
    const updateData: any = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.design_mode !== undefined) updateData.design_mode = body.design_mode
    if (body.theme !== undefined) updateData.theme = body.theme

    const { data: updatedBook, error: updateError } = await supabase
      .from("books")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedBook)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update book" },
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

    // Get book to verify ownership and get PDF URL for cleanup
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

    // Delete PDF file from storage if it exists
    if (book.pdf_url) {
      try {
        const serviceClient = await createServiceRoleClient()
        
        // Extract file path from the public URL
        const urlParts = book.pdf_url.split("/")
        const attachmentsIndex = urlParts.findIndex((part: string) => part === "attachments")
        
        if (attachmentsIndex !== -1) {
          const fileName = urlParts.slice(attachmentsIndex + 1).join("/")
          
          // Delete the file from storage
          await serviceClient.storage
            .from("attachments")
            .remove([fileName])
        }
      } catch (storageError) {
        // Log but don't fail the deletion if storage cleanup fails
        console.error("Error deleting PDF from storage:", storageError)
      }
    }

    // Delete the book (this will cascade delete book_entries due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", id)
      .eq("household_id", household.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete book" },
      { status: 500 }
    )
  }
}

