import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This endpoint is called by Vercel Cron
// Schedule: Weekly on Mondays at 2 PM (configured in vercel.json)
export async function GET(request: Request) {
  try {
    // Verify this is called by Vercel Cron (optional: add auth header check)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    // Get all enabled reminders for this week
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("enabled", true)
      .eq("frequency", "weekly")
      .eq("weekday", new Date().getDay()) // Today's weekday

    if (error) throw error

    // TODO: Send reminders via email or SMS
    // For now, just log
    console.log(`Processing ${reminders?.length || 0} reminders`)

    return NextResponse.json({
      processed: reminders?.length || 0,
      message: "Reminders processed",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    )
  }
}




