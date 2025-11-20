import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import EntriesPageClient from "@/components/app/entries-page-client"

export default async function AppHomePage() {
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

  return <EntriesPageClient householdId={household.id} />
}





