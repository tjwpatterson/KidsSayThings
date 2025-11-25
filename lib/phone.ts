"use server"

/**
 * Normalize a phone number into E.164 format.
 * Defaults to US (+1) if no country code is present.
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Remove everything except digits and leading +
  const digitsOnly = trimmed.replace(/[^\d+]/g, "")

  if (!digitsOnly) return null

  if (digitsOnly.startsWith("+")) {
    return digitsOnly
  }

  // Strip all non-digits and assume US if 10 digits
  const digits = digitsOnly.replace(/\D/g, "")

  if (!digits) return null

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  if (digits.length === 10) {
    return `+1${digits}`
  }

  return `+${digits}`
}

