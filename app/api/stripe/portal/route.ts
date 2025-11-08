import { NextResponse } from "next/server"
import Stripe from "stripe"

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return null
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  })
}

export async function GET(request: Request) {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      )
    }
    // This is a placeholder - in production, you'd get the customer ID from the user's session
    // For now, redirect to Stripe's customer portal setup
    return NextResponse.json({
      message: "Stripe Customer Portal",
      note: "Configure customer portal in Stripe dashboard and link here",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to access customer portal" },
      { status: 500 }
    )
  }
}



