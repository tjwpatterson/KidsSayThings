import twilio from "twilio"
import { NextResponse } from "next/server"
import { normalizePhoneNumber } from "@/lib/phone"
import { parseSmsBody } from "@/lib/sms"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const UNKNOWN_NUMBER = "This number isn’t linked to a SaySo account yet."
const INVALID_FORMAT =
  "Please start your message with the child’s name, e.g. “Zeke: Do ya like jazz”."

function respondWithMessage(message: string, status = 200) {
  const messagingResponse = new twilio.twiml.MessagingResponse()
  messagingResponse.message(message)
  return new NextResponse(messagingResponse.toString(), {
    status,
    headers: { "Content-Type": "text/xml" },
  })
}

function normalizeDisplayName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fromRaw = formData.get("From")?.toString() || ""
    const bodyRaw = formData.get("Body")?.toString() || ""

    const normalizedFrom = normalizePhoneNumber(fromRaw)
    if (!normalizedFrom) {
      return respondWithMessage(UNKNOWN_NUMBER)
    }

    const parsed = parseSmsBody(bodyRaw)
    if (!parsed) {
      return respondWithMessage(INVALID_FORMAT)
    }

    const supabase = await createServiceRoleClient()

    const { data: phoneRecord, error: phoneError } = await supabase
      .from("parent_phone_numbers")
      .select("id, household_id, user_id")
      .eq("phone_number", normalizedFrom)
      .maybeSingle()

    if (phoneError || !phoneRecord) {
      return respondWithMessage(UNKNOWN_NUMBER)
    }

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id, display_name")
      .eq("household_id", phoneRecord.household_id)
      .order("display_name", { ascending: true })

    if (personsError || !persons || persons.length === 0) {
      return respondWithMessage(
        "No kids are set up yet. Add them in the SaySo app to start saving quotes."
      )
    }

    const kidNameNormalized = normalizeDisplayName(parsed.kidName)
    const matchedPerson = persons.find(
      (person) => normalizeDisplayName(person.display_name) === kidNameNormalized
    )

    if (!matchedPerson) {
      const names = persons.map((p) => p.display_name).join(", ")
      return respondWithMessage(
        `I couldn’t find “${parsed.kidName}”. Kids on this account: ${names}.`
      )
    }

    const timestampValue =
      formData.get("Timestamp")?.toString() ||
      formData.get("SentTimestamp")?.toString() ||
      formData.get("DateSent")?.toString()

    let createdAt = new Date()
    if (timestampValue) {
      const candidate = new Date(timestampValue)
      if (!Number.isNaN(candidate.getTime())) {
        createdAt = candidate
      }
    }

    const entryDate = createdAt.toISOString().slice(0, 10)

    const { error: insertError } = await supabase.from("entries").insert({
      household_id: phoneRecord.household_id,
      said_by: matchedPerson.id,
      captured_by: phoneRecord.user_id,
      text: parsed.content,
      source: "sms",
      entry_date: entryDate,
      created_at: createdAt.toISOString(),
    })

    if (insertError) {
      console.error("Failed to insert SMS entry", insertError)
      return respondWithMessage(
        "We couldn’t save that quote just now—please try again.",
        500
      )
    }

    return respondWithMessage(
      `Saved for ${matchedPerson.display_name} ✅ – “${parsed.content.slice(0, 140)}${parsed.content.length > 140 ? "…" : ""}”`
    )
  } catch (error) {
    console.error("Twilio webhook error", error)
    return respondWithMessage(
      "We ran into an error while saving that. Please try again in a moment.",
      500
    )
  }
}

