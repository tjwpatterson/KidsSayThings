"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

type Status = "loading" | "invalid" | "ready" | "success"

const MIN_LENGTH = 12

const passwordRules = [
  {
    label: "At least 12 characters",
    test: (value: string) => value.length >= MIN_LENGTH,
  },
  {
    label: "Contains an uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "Contains a lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "Contains a number",
    test: (value: string) => /\d/.test(value),
  },
]

export default function PasswordRecoveryForm() {
  const [status, setStatus] = useState<Status>("loading")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function hydrateSessionFromLink() {
      if (typeof window === "undefined") {
        return
      }

      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !data.session) {
          setStatus("invalid")
          setLinkError("This reset link is invalid or has expired. Please request a fresh link.")
          return
        }

        url.searchParams.delete("code")
        window.history.replaceState({}, document.title, url.pathname + url.search)
        setStatus("ready")
        return
      }

      const hash = window.location.hash
      if (!hash) {
        setStatus("invalid")
        setLinkError("This reset link is missing information. Please request a new one.")
        return
      }

      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const type = params.get("type")

      if (!accessToken || !refreshToken || type !== "recovery") {
        setStatus("invalid")
        setLinkError("This reset link is invalid or has expired. Request a fresh link.")
        return
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error || !data.session) {
        setStatus("invalid")
        setLinkError("We couldn't verify this link. Please request a new password reset email.")
        return
      }

      window.history.replaceState({}, document.title, window.location.pathname)
      setStatus("ready")
    }

    hydrateSessionFromLink()
  }, [supabase])

  const passwordChecks = useMemo(() => {
    return passwordRules.map((rule) => ({
      label: rule.label,
      passed: rule.test(password),
    }))
  }, [password])

  const canSubmit =
    passwordChecks.every((rule) => rule.passed) &&
    password === confirmPassword &&
    password.length > 0 &&
    status === "ready"

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        throw error
      }

      await supabase.auth.signOut()
      setStatus("success")
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error?.message || "Please request a new reset link and try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Verifying reset link…</p>
      </div>
    )
  }

  if (status === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="font-medium mb-2">Reset link issue</p>
          <p className="text-sm text-muted-foreground">{linkError}</p>
        </div>
        <div className="space-y-2">
          <Link href="/reset-password">
            <Button className="w-full">Send a new reset link</Button>
          </Link>
          <Link href="/login" className="text-sm text-primary hover:underline inline-block">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-muted rounded-lg border border-border">
          <p className="font-medium mb-2">Password updated</p>
          <p className="text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            router.push("/login")
          }}
        >
          Continue to Sign In
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a new password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Re‑enter new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div className="rounded-lg border border-border p-3 bg-muted/40 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Password requirements
        </p>
        <ul className="space-y-1 text-sm">
          {passwordChecks.map((rule) => (
            <li
              key={rule.label}
              className={rule.passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}
            >
              {rule.passed ? "✓" : "•"} {rule.label}
            </li>
          ))}
        </ul>
      </div>
      <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
        {submitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  )
}


