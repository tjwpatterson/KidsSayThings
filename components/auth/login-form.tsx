"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [activeTab, setActiveTab] = useState("password")
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Show error message from URL if present (e.g., from auth callback)
  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      toast({
        title: "Authentication Error",
        description: decodeURIComponent(error),
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Logged in successfully",
      })

      // Redirect will happen automatically via middleware
      window.location.href = "/app"
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendSMSCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Format phone number (add +1 if not present for US numbers)
      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+1${formattedPhone.replace(/\D/g, "")}`
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) throw error

      setCodeSent(true)
      toast({
        title: "Code sent",
        description: "Check your phone for the verification code",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySMSCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+1${formattedPhone.replace(/\D/g, "")}`
      }

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Logged in successfully",
      })

      window.location.href = "/app"
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="sms">SMS Code</TabsTrigger>
      </TabsList>

      <TabsContent value="password" className="space-y-4">
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="sms" className="space-y-4">
        {!codeSent ? (
          <form onSubmit={handleSendSMSCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number to receive a verification code
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifySMSCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(value)
                }}
                maxLength={6}
                required
                disabled={loading}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to {phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCodeSent(false)
                  setCode("")
                }}
                disabled={loading}
              >
                Change Number
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </form>
        )}
      </TabsContent>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </Tabs>
  )
}
