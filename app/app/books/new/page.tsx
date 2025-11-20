import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import BookWizard from "@/components/app/book-wizard"

export default async function NewBookPage() {
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
      <h1 className="text-3xl font-serif font-bold mb-8">Create New Book</h1>
      <BookWizard householdId={household.id} />
    </div>
  )
}





