"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FileText, BookOpen, Settings } from "lucide-react"
import SignOutButton from "@/components/app/sign-out-button"

export default function AppNav() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    loadUser()
  }, [])

  if (!mounted) {
    return (
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/app" className="text-xl font-serif font-bold">
            SaySo
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/app" className="text-xl font-serif font-bold">
          SaySo
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app">
              <FileText className="h-4 w-4 mr-2" />
              Entries
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/books">
              <BookOpen className="h-4 w-4 mr-2" />
              Books
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          {user && <SignOutButton />}
        </div>
      </div>
    </nav>
  )
}

