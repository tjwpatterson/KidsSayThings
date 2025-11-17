import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ResetPasswordForm from "@/components/auth/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, redirect to app
  if (user) {
    redirect("/app")
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>
        <ResetPasswordForm error={params.error} />
      </div>
    </div>
  )
}

