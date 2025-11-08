import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import QuickAddCard from "@/components/app/quick-add-card"
import EntriesFeed from "@/components/app/entries-feed"

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">
          Welcome back to {household.name}
        </h1>
        <p className="text-muted-foreground">
          Capture a new quote or memory below.
        </p>
      </div>

      <QuickAddCard householdId={household.id} />

      <div className="mt-12">
        <EntriesFeed householdId={household.id} />
      </div>
    </div>
  )
}



