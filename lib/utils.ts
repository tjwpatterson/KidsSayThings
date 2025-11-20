import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Brand color palette
export const BRAND_COLORS = [
  "#C19548", // PALE BLUSH
  "#EF6938", // PEACH PINK
  "#B26347", // BURNT ORANGE
  "#565645", // CAMELLIA
  "#D1BAD6", // ASH ROSE
  "#6B343D", // LAGOON
  "#565645", // RAFFIA (golden brown - same hex but different visual)
  "#D18AD6", // WINTER SKY (blue-gray - similar hex but different visual)
  "#6B343D", // CALLA GREEN (green - same hex but different visual)
] as const

/**
 * Assigns a consistent color from the brand palette to a person based on their ID
 * Uses a hash function to ensure the same person always gets the same color
 */
export function getPersonColor(personId: string): string {
  // Create a hash from the person ID
  const hash = personId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  // Use absolute value to ensure positive index
  const colorIndex = Math.abs(hash) % BRAND_COLORS.length
  return BRAND_COLORS[colorIndex]
}

/**
 * Gets the first name from a full display name
 */
export function getFirstName(displayName: string): string {
  if (!displayName || typeof displayName !== 'string') {
    return ''
  }
  return displayName.split(' ')[0] || displayName
}





