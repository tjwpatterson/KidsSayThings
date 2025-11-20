import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AppNav from "@/components/app/app-nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}





