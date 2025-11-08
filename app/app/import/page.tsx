import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentHousehold } from "@/lib/household"
import CSVImportForm from "@/components/app/csv-import-form"

export default async function ImportPage() {
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
        <h1 className="text-3xl font-serif font-bold mb-2">Import CSV</h1>
        <p className="text-muted-foreground">
          Import entries from a CSV file. Expected columns: text, said_by, date,
          tags, type, notes
        </p>
      </div>

      <CSVImportForm householdId={household.id} />
    </div>
  )
}



