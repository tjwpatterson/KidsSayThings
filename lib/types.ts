export type EntryType = "quote" | "note" | "milestone"
export type EntrySource = "app" | "sms" | "import"
export type EntryVisibility = "household" | "private"
export type BookSize = "6x9" | "digital"
export type BookTheme = "classic" | "playful"
export type BookCoverStyle = "linen" | "solid" | "gradient"
export type BookStatus = "draft" | "rendering" | "ready" | "error"
export type BookDesignMode = "auto" | "manual" | null
export type PageLayout = "A" | "B" | "C"
export type ReminderChannel = "email" | "sms"
export type ReminderFrequency = "daily" | "weekly" | "monthly"
export type HouseholdRole = "owner" | "admin" | "member"

export interface Household {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: HouseholdRole
  created_at: string
}

export interface Person {
  id: string
  household_id: string
  display_name: string
  birthdate: string | null
  avatar_url: string | null
  created_at: string
}

export interface Entry {
  id: string
  household_id: string
  said_by: string | null
  captured_by: string
  text: string
  entry_type: EntryType
  source: EntrySource
  visibility: EntryVisibility
  entry_date: string
  created_at: string
  updated_at: string
}

export interface EntryTag {
  entry_id: string
  tag: string
}

export interface Attachment {
  id: string
  entry_id: string
  kind: "image" | "audio"
  url: string
  width: number | null
  height: number | null
  duration_seconds: number | null
  created_at: string
}

export interface Book {
  id: string
  household_id: string
  title: string | null
  date_start: string
  date_end: string
  size: BookSize
  theme: BookTheme
  cover_style: BookCoverStyle
  dedication: string | null
  created_at: string
  updated_at?: string
  status: BookStatus
  pdf_url: string | null
  design_mode?: BookDesignMode
}

export interface BookEntry {
  book_id: string
  entry_id: string
  position: number
}

export interface PageContentItem {
  id: string
  type: "photo" | "quote"
  position?: { x: number; y: number; width?: number; height?: number }
  crop?: { x: number; y: number; width: number; height: number }
  zoom?: number
}

export interface BookPage {
  id: string
  book_id: string
  page_number: number
  left_layout: PageLayout | null
  right_layout: PageLayout | null
  left_content: PageContentItem[]
  right_content: PageContentItem[]
  created_at: string
  updated_at: string
}

export interface BookPhoto {
  id: string
  book_id: string
  attachment_id: string | null
  url: string
  width: number | null
  height: number | null
  filename: string | null
  created_at: string
}

export interface BookThemeConfig {
  name: string
  id: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
  }
  fonts: {
    heading: string
    body: string
  }
}

export interface Reminder {
  id: string
  household_id: string
  user_id: string
  channel: ReminderChannel
  frequency: ReminderFrequency
  weekday: number | null
  hour: number | null
  tz: string
  enabled: boolean
  created_at: string
}

export interface ParentPhoneNumber {
  id: string
  household_id: string
  user_id: string
  phone_number: string
  label?: string | null
  verified: boolean
  created_at: string
}




