import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  // If there's an error in the URL (from Supabase), redirect to login with error
  if (error) {
    const errorMessage = errorDescription || error
    // If it's a recovery/password reset error, redirect to reset password page
    if (type === "recovery") {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(errorMessage)}`
      )
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  const supabase = await createClient()

  // Handle PKCE flow (code-based) - this is the modern Supabase flow
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      // If it's a recovery/password reset, redirect to reset password page
      if (type === "recovery") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=${encodeURIComponent(exchangeError.message || "Password reset failed")}`
        )
      }
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message || "Authentication failed")}`
      )
    }

    // Verify we have a session
    if (!data.session) {
      console.error("No session after code exchange")
      if (type === "recovery") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=${encodeURIComponent("Failed to create session")}`
        )
      }
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to create session")}`
      )
    }

    // If this is a password reset (recovery), redirect to update password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/update-password`)
    }

    // Successfully authenticated, redirect to app
    return NextResponse.redirect(`${origin}/app`)
  }
  
  // Handle token-based magic link flow (older flow, deprecated)
  // This flow is no longer recommended by Supabase
  if (token && type === "magiclink") {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("This magic link format is no longer supported. Please use password login or request a new magic link.")}`
    )
  }

  // Handle token-based password reset (older flow - deprecated but still supported)
  if (token && type === "recovery") {
    // For token-based recovery, we need to exchange the token for a session
    // This is the older flow, modern Supabase uses PKCE (code-based) above
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      })

      if (verifyError || !data.session) {
        return NextResponse.redirect(
          `${origin}/reset-password?error=${encodeURIComponent("Password reset link is invalid or has expired. Please request a new one.")}`
        )
      }

      return NextResponse.redirect(`${origin}/update-password`)
    } catch (err: any) {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(err.message || "Password reset link is invalid or has expired. Please request a new one.")}`
      )
    }
  }

  // No code or token found - invalid callback
  console.error("Auth callback called without code or token")
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid authentication link")}`
  )
}



