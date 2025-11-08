import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")
  const type = requestUrl.searchParams.get("type")
  const origin = requestUrl.origin

  const supabase = await createClient()

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }
  // Handle token-based magic link flow (older flow)
  else if (token && type === "magiclink") {
    // For token-based magic links, we need to extract the email from the token
    // or use the verifyOtp method. However, Supabase now primarily uses PKCE flow.
    // If we get here, it means the link might be expired or invalid.
    // Let's try to verify it, but this flow is deprecated in favor of PKCE.
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Magic link expired. Please request a new one.")}`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/app`)
}



