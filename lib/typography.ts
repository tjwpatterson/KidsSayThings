/**
 * Typography system for consistent text sizing throughout the book
 * Auto-scales font size based on quote length within defined ranges
 */

export interface TypographyConfig {
  fontSize: string
  lineHeight: number
  maxWidth: string
}

/**
 * Calculate font size based on quote length
 * Returns a value between minSize and maxSize (in rem)
 */
function calculateFontSize(text: string, minSize: number, maxSize: number): number {
  const length = text.length
  
  // Very short quotes (< 30 chars): use max size
  if (length < 30) {
    return maxSize
  }
  
  // Short quotes (30-50 chars): slightly smaller
  if (length < 50) {
    return maxSize * 0.9
  }
  
  // Medium quotes (50-100 chars): standard size
  if (length < 100) {
    return maxSize * 0.75
  }
  
  // Long quotes (100-150 chars): smaller
  if (length < 150) {
    return maxSize * 0.65
  }
  
  // Very long quotes (> 150 chars): minimum size
  return minSize
}

/**
 * Typography configuration for full page quotes
 * Large, centered text for single quote pages
 */
export function getFullPageQuoteStyle(text: string): TypographyConfig {
  const fontSize = calculateFontSize(text, 1.2, 2.5) // 1.2rem - 2.5rem range
  
  return {
    fontSize: `${fontSize}rem`,
    lineHeight: 1.3,
    maxWidth: '80%',
  }
}

/**
 * Typography configuration for partial page quotes (1/3 of page)
 * Medium text that fits in the quote area of photo+quote layouts
 */
export function getPartialPageQuoteStyle(text: string): TypographyConfig {
  const fontSize = calculateFontSize(text, 1.0, 1.5) // 1.0rem - 1.5rem range
  
  return {
    fontSize: `${fontSize}rem`,
    lineHeight: 1.4,
    maxWidth: '90%',
  }
}

/**
 * Consistent attribution style for person names
 * Always the same size regardless of quote length
 */
export const attributionStyle: TypographyConfig = {
  fontSize: '1rem', // 16px
  lineHeight: 1.5,
  maxWidth: '100%',
}

/**
 * Page label style (Cover, Title Page, etc.)
 */
export const pageLabelStyle: TypographyConfig = {
  fontSize: '0.875rem', // 14px
  lineHeight: 1.4,
  maxWidth: '100%',
}

