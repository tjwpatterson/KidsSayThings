import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import SettingsContent from "@/components/app/settings-content"

export default async function SettingsPage() {
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
        <h1 className="text-3xl font-serif font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your household and preferences.
        </p>
      </div>

      <SettingsContent household={household} />
    </div>
  )
}



