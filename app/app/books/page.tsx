import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import BooksList from "@/components/app/books-list"

export const dynamic = "force-dynamic"

export default async function BooksPage() {
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Books</h1>
          <p className="text-muted-foreground">
            Create beautiful print-ready books from your memories.
          </p>
        </div>
      </div>

      <BooksList householdId={household.id} />
    </div>
  )
}






