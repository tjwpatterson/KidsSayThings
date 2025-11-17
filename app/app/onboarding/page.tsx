import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import OnboardingForm from "@/components/app/onboarding-form"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has a household
  const household = await getCurrentHousehold()
  if (household) {
    redirect("/app")
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-serif font-bold mb-2">
        Welcome to SaySo!
      </h1>
      <p className="text-muted-foreground mb-8">
        Let&apos;s get you set up. First, create your household and add your
        first person.
      </p>
      <OnboardingForm />
    </div>
  )
}




