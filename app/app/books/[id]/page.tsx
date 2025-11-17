import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import BookDetail from "@/components/app/book-detail"

export default async function BookDetailPage({
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

  // Verify book belongs to household
  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .single()

  if (error || !book) {
    redirect("/app/books")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BookDetail book={book} householdId={household.id} />
    </div>
  )
}




