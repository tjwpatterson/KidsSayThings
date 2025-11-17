import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import UpdatePasswordForm from "@/components/auth/update-password-form"

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold">Update Password</h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  )
}

