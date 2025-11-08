import { createClient } from "@/lib/supabase/server"

export async function getCurrentHousehold() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's household membership
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single()

  if (!membership) return null

  // Get household details
  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", membership.household_id)
    .single()

  return household
    ? {
        ...household,
        role: membership.role,
      }
    : null
}

export async function createHousehold(name: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // Create household
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      name,
      owner_id: user.id,
    })
    .select()
    .single()

  if (householdError || !household) {
    throw householdError || new Error("Failed to create household")
  }

  // Add owner as member
  const { error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "owner",
    })

  if (memberError) {
    throw memberError
  }

  return household
}



