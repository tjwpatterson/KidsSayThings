export interface ParsedSmsPayload {
  kidName: string
  content: string
}

export function parseSmsBody(message: string): ParsedSmsPayload | null {
  if (!message) return null
  const trimmed = message.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^\s*([^:-]+?)\s*[:\-]\s*(.+)$/)
  if (!match) {
    return null
  }

  const kidName = match[1]?.trim()
  const content = match[2]?.trim()

  if (!kidName || !content) {
    return null
  }

  return { kidName, content }
}

