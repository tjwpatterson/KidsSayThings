import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-serif font-bold mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Sign in to your SaySo account
        </p>
        <LoginForm />
      </div>
    </div>
  )
}




