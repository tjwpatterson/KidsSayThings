// PDF generation using @react-pdf/renderer (serverless-friendly)
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import type { Book, Entry, Person } from "@/lib/types"
import { format } from "date-fns"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

interface BookRenderOptions {
  book: Book
  entries: Entry[]
  persons: Record<string, Person>
  tags: Record<string, string[]>
}

// Helper to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return format(date, "MMMM d, yyyy")
}

// Create styles based on theme
function createStyles(isClassic: boolean, size: { width: number; height: number }) {
  return StyleSheet.create({
    page: {
      padding: 60,
      fontSize: isClassic ? 12 : 14,
      fontFamily: isClassic ? "Times-Roman" : "Helvetica",
      backgroundColor: "#ffffff",
    },
    coverPage: {
      width: size.width,
      height: size.height,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fafafa",
    },
    coverTitle: {
      fontSize: isClassic ? 42 : 48,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      fontFamily: isClassic ? "Times-Bold" : "Helvetica-Bold",
    },
    coverSubtitle: {
      fontSize: 14,
      color: "#666666",
      marginTop: 20,
    },
    coverFooter: {
      fontSize: 10,
      color: "#999999",
      marginTop: "auto",
      opacity: 0.6,
    },
    titlePage: {
      width: size.width,
      height: size.height,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
    titlePageTitle: {
      fontSize: isClassic ? 36 : 40,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      fontFamily: isClassic ? "Times-Bold" : "Helvetica-Bold",
    },
    titlePageDate: {
      fontSize: 12,
      color: "#666666",
      marginBottom: 40,
    },
    dedication: {
      fontSize: 13,
      fontStyle: "italic",
      color: "#333333",
      textAlign: "center",
      marginTop: 40,
      maxWidth: size.width - 180,
    },
    quotePage: {
      width: size.width,
      height: size.height,
      padding: 90,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    quoteText: {
      fontSize: isClassic ? 22 : 26,
      lineHeight: 1.6,
      textAlign: "center",
      marginBottom: 20,
      fontFamily: isClassic ? "Times-Roman" : "Helvetica",
    },
    quoteAuthor: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#666666",
      textAlign: "center",
      marginTop: 20,
    },
    quoteDate: {
      fontSize: 9,
      color: "#999999",
      textAlign: "center",
      marginTop: 10,
    },
    bodyPage: {
      width: size.width,
      height: size.height,
      padding: 60,
    },
    divider: {
      borderTopWidth: 0.5,
      borderTopColor: "#e5e5e5",
      marginBottom: 20,
    },
    bodyAuthor: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#666666",
      marginBottom: 15,
    },
    bodyText: {
      fontSize: isClassic ? 13 : 15,
      lineHeight: 1.8,
      marginBottom: 20,
      fontFamily: isClassic ? "Times-Roman" : "Helvetica",
    },
    bodyTags: {
      fontSize: 9,
      color: "#999999",
      marginTop: 15,
    },
    bodyDate: {
      fontSize: 9,
      color: "#999999",
      marginTop: 15,
    },
    monthDivider: {
      width: size.width,
      height: size.height,
      padding: 60,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
    monthTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 25,
      fontFamily: isClassic ? "Times-Bold" : "Helvetica-Bold",
    },
    monthLine: {
      width: 100,
      height: 0.5,
      backgroundColor: "#e0e0e0",
    },
  })
}

// Cover page component
function CoverPage({ book, size, styles }: { book: Book; size: { width: number; height: number }; styles: any }) {
  const subtitle =
    new Date(book.date_start).getFullYear() === new Date(book.date_end).getFullYear()
      ? String(new Date(book.date_start).getFullYear())
      : `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`

  return (
    <Page size={[size.width, size.height]} style={styles.coverPage}>
      <Text style={styles.coverTitle}>{book.title || "SaySo"}</Text>
      <Text style={styles.coverSubtitle}>{subtitle}</Text>
      <Text style={styles.coverFooter}>A Collection of Memories</Text>
    </Page>
  )
}

// Title page component
function TitlePage({ book, size, styles }: { book: Book; size: { width: number; height: number }; styles: any }) {
  return (
    <Page size={[size.width, size.height]} style={styles.titlePage}>
      <Text style={styles.titlePageTitle}>{book.title || "SaySo"}</Text>
      <Text style={styles.titlePageDate}>
        {formatDate(book.date_start)} - {formatDate(book.date_end)}
      </Text>
      {book.dedication && (
        <Text style={styles.dedication}>{book.dedication}</Text>
      )}
    </Page>
  )
}

// Entry page component
function EntryPage({
  entry,
  person,
  tags,
  isShort,
  size,
  styles,
}: {
  entry: Entry
  person: Person | null
  tags: string[]
  isShort: boolean
  size: { width: number; height: number }
  styles: any
}) {
  if (isShort && entry.text.length <= 180) {
    // Pull quote style
    return (
      <Page size={[size.width, size.height]} style={styles.quotePage}>
        <Text style={styles.quoteText}>{entry.text}</Text>
        {person && <Text style={styles.quoteAuthor}>— {person.display_name}</Text>}
        <Text style={styles.quoteDate}>{formatDate(entry.entry_date)}</Text>
      </Page>
    )
  } else {
    // Body text style
    return (
      <Page size={[size.width, size.height]} style={styles.bodyPage}>
        <View style={styles.divider} />
        {person && <Text style={styles.bodyAuthor}>{person.display_name}</Text>}
        <Text style={styles.bodyText}>{entry.text}</Text>
        {tags.length > 0 && (
          <Text style={styles.bodyTags}>{tags.join(" • ")}</Text>
        )}
        <Text style={styles.bodyDate}>{formatDate(entry.entry_date)}</Text>
      </Page>
    )
  }
}

// Month divider component
function MonthDivider({
  monthName,
  year,
  size,
  styles,
}: {
  monthName: string
  year: string
  size: { width: number; height: number }
  styles: any
}) {
  return (
    <Page size={[size.width, size.height]} style={styles.monthDivider}>
      <Text style={styles.monthTitle}>
        {monthName} {year}
      </Text>
      <View style={styles.monthLine} />
    </Page>
  )
}

export async function generateBookPDF({
  book,
  entries,
  persons,
  tags,
}: BookRenderOptions): Promise<Buffer> {
  const dimensions = {
    "6x9": { width: 432, height: 648 },
    "8x10": { width: 576, height: 720 },
  }

  const size = dimensions[book.size]
  const theme = book.theme
  const isClassic = theme === "classic"
  const styles = createStyles(isClassic, size)

  // Group entries by month
  const entriesByMonth: Record<string, typeof entries> = {}
  entries.forEach((entry) => {
    const date = new Date(entry.entry_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (!entriesByMonth[monthKey]) {
      entriesByMonth[monthKey] = []
    }
    entriesByMonth[monthKey].push(entry)
  })

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Build pages
  const pages: React.ReactElement[] = []

  // Cover page
  pages.push(<CoverPage key="cover" book={book} size={size} styles={styles} />)

  // Title page
  pages.push(<TitlePage key="title" book={book} size={size} styles={styles} />)

  // Sort months chronologically and render
  const sortedMonths = Object.keys(entriesByMonth).sort()
  sortedMonths.forEach((monthKey) => {
    const [year, month] = monthKey.split("-")
    const monthName = monthNames[parseInt(month) - 1]

    // Month divider
    pages.push(
      <MonthDivider
        key={`month-${monthKey}`}
        monthName={monthName}
        year={year}
        size={size}
        styles={styles}
      />
    )

    // Entries for this month
    const monthEntries = entriesByMonth[monthKey]
    monthEntries.forEach((entry) => {
      const person = entry.said_by ? persons[entry.said_by] : null
      const entryTags = tags[entry.id] || []
      const isShort = entry.text.length <= 180

      pages.push(
        <EntryPage
          key={entry.id}
          entry={entry}
          person={person}
          tags={entryTags}
          isShort={isShort}
          size={size}
          styles={styles}
        />
      )
    })
  })

  // Render to PDF buffer
  const doc = <Document>{pages}</Document>
  const buffer = await renderToBuffer(doc)

  return buffer
}
