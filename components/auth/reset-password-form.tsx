"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use environment variable if available, otherwise fall back to current origin
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setSent(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Click the link in the email to reset your password. The link will
            expire in 1 hour.
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Important: Make sure to click the link within 1 hour, and use the same browser/device where you requested it.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
        >
          Send Another Link
        </Button>
        <div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
      <div className="text-center">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to Sign In
        </Link>
      </div>
    </form>
  )
}

