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
    const fileName = book.pdf_url.split("/").slice(-2).join("/") // Get path from URL
    const { data, error } = await serviceClient.storage
      .from("attachments")
      .createSignedUrl(fileName, 3600)

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to generate download URL" },
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



