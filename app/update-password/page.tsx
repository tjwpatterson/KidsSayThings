import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import UpdatePasswordForm from "@/components/auth/update-password-form"

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to reset password page with error
  if (!user) {
    const errorMsg = params.error 
      ? `?error=${encodeURIComponent(params.error)}`
      : "?error=Session expired. Please request a new password reset link."
    redirect(`/reset-password${errorMsg}`)
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
        <UpdatePasswordForm error={params.error} />
      </div>
    </div>
  )
}

