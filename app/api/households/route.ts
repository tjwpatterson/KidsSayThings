import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentHousehold } from "@/lib/household"
import { createHousehold } from "@/lib/household"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Household name is required" },
        { status: 400 }
      )
    }

    const household = await createHousehold(name.trim())

    return NextResponse.json(household)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create household" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
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

    // Only owners can update
    if (household.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can update household" },
        { status: 403 }
      )
    }

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Household name is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("households")
      .update({ name: name.trim() })
      .eq("id", household.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update household" },
      { status: 500 }
    )
  }
}
