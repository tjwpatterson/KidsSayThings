"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function NewBookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const createBook = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get household
        const { data: membership } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single()

        if (!membership) {
          router.push("/app/onboarding")
          return
        }

        // Create book with default values
        const today = new Date()
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(today.getFullYear() - 1)

        const { data: book, error } = await supabase
          .from("books")
          .insert({
            household_id: membership.household_id,
            date_start: oneYearAgo.toISOString().split("T")[0],
            date_end: today.toISOString().split("T")[0],
            title: null,
            size: "6x9",
            theme: "classic",
            cover_style: "linen",
            dedication: null,
            status: "draft",
          })
          .select()
          .single()

        if (error) throw error

        // Redirect to design page
        router.push(`/app/books/${book.id}/design`)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create book",
          variant: "destructive",
        })
        router.push("/app/books")
      } finally {
        setLoading(false)
      }
    }

    createBook()
  }, [router, supabase, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Creating your book...</p>
        </div>
      </div>
    )
  }

  return null
}





