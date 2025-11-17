import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import PersonProfile from "@/components/app/person-profile"

export default async function PersonPage({
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

  // Verify person belongs to household
  const { data: person, error } = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .single()

  if (error || !person) {
    redirect("/app/people")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PersonProfile person={person} householdId={household.id} />
    </div>
  )
}




