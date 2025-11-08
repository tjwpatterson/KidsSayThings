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
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message || "Authentication failed")}`
      )
    }

    // Verify we have a session
    if (!data.session) {
      console.error("No session after code exchange")
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to create session")}`
      )
    }

    // Successfully authenticated, redirect to app
    return NextResponse.redirect(`${origin}/app`)
  }
  
  // Handle token-based magic link flow (older flow, deprecated)
  // This flow is no longer recommended by Supabase
  if (token && type === "magiclink") {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("This magic link format is no longer supported. Please request a new magic link.")}`
    )
  }

  // No code or token found - invalid callback
  console.error("Auth callback called without code or token")
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid authentication link")}`
  )
}



