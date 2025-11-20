// PDF generation using jsPDF (serverless-friendly, no dependencies)
import { jsPDF } from "jspdf"
import type { Book, Entry, Person } from "@/lib/types"
import { format } from "date-fns"

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

// Convert inches to points (1 inch = 72 points)
function inchesToPoints(inches: number): number {
  return inches * 72
}

export async function generateBookPDF({
  book,
  entries,
  persons,
  tags,
}: BookRenderOptions): Promise<Buffer> {
  // Page dimensions in inches, converted to points
  const dimensions: Record<"6x9" | "digital", { width: number; height: number }> = {
    "6x9": { width: 6, height: 9 },
    "digital": { width: 8.5, height: 11 }, // Standard US Letter size for digital books
  }

  const sizeInches = dimensions[book.size]
  const width = inchesToPoints(sizeInches.width)
  const height = inchesToPoints(sizeInches.height)
  const theme = book.theme
  const isClassic = theme === "classic"

  // Create PDF document
  const doc = new jsPDF({
    unit: "pt",
    format: [width, height],
    compress: true,
  })

  // Set margins (0.5 inch = 36 points)
  const margin = 60
  const contentWidth = width - margin * 2
  const contentHeight = height - margin * 2

  // Helper to add a new page
  const addPage = () => {
    doc.addPage([width, height])
  }

  // Render cover page
  const renderCover = () => {
    // Background color based on cover style
    if (book.cover_style === "gradient" || book.cover_style === "solid") {
      doc.setFillColor(102, 126, 234) // #667eea
      doc.rect(0, 0, width, height, "F")
    } else {
      doc.setFillColor(245, 245, 245) // #f5f5f5
      doc.rect(0, 0, width, height, "F")
    }

    const isDarkCover = book.cover_style === "solid" || book.cover_style === "gradient"

    // Title
    doc.setFontSize(isClassic ? 42 : 48)
    doc.setTextColor(isDarkCover ? 255 : 0, isDarkCover ? 255 : 0, isDarkCover ? 255 : 0)
    doc.setFont(isClassic ? "times" : "helvetica", "bold")
    const titleY = height / 2 - 40
    doc.text(book.title || "SaySo", width / 2, titleY, {
      align: "center",
      maxWidth: contentWidth,
    })

    // Subtitle
    const subtitle =
      new Date(book.date_start).getFullYear() === new Date(book.date_end).getFullYear()
        ? String(new Date(book.date_start).getFullYear())
        : `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`

    doc.setFontSize(14)
    doc.setTextColor(isDarkCover ? 204 : 102, isDarkCover ? 204 : 102, isDarkCover ? 204 : 102)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, width / 2, titleY + 70, {
      align: "center",
      maxWidth: contentWidth,
    })

    // Footer
    doc.setFontSize(10)
    doc.setTextColor(isDarkCover ? 136 : 153, isDarkCover ? 136 : 153, isDarkCover ? 136 : 153)
    doc.text("A Collection of Memories", width / 2, height - 80, {
      align: "center",
      maxWidth: contentWidth,
    })
  }

  // Render title page
  const renderTitlePage = () => {
    addPage()

    // Title
    doc.setFontSize(isClassic ? 36 : 40)
    doc.setTextColor(0, 0, 0)
    doc.setFont(isClassic ? "times" : "helvetica", "bold")
    const titleY = height / 2 - 80
    doc.text(book.title || "SaySo", width / 2, titleY, {
      align: "center",
      maxWidth: contentWidth,
    })

    // Date range
    doc.setFontSize(12)
    doc.setTextColor(102, 102, 102)
    doc.setFont("helvetica", "normal")
    doc.text(
      `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`,
      width / 2,
      titleY + 60,
      {
        align: "center",
        maxWidth: contentWidth,
      }
    )

    // Dedication
    if (book.dedication) {
      doc.setFontSize(13)
      doc.setTextColor(51, 51, 51)
      doc.setFont("times", "italic")
      const dedicationLines = doc.splitTextToSize(book.dedication, contentWidth - 60)
      doc.text(dedicationLines, width / 2, titleY + 120, {
        align: "center",
        maxWidth: contentWidth - 60,
      })
    }
  }

  // Render entry
  const renderEntry = (entry: Entry, isShort: boolean) => {
    addPage()
    const person = entry.said_by ? persons[entry.said_by] : null
    const entryTags = tags[entry.id] || []

    if (isShort && entry.text.length <= 180) {
      // Pull quote style - centered
      const centerY = height / 2
      const textWidth = contentWidth - 60

      // Quote text
      doc.setFontSize(isClassic ? 22 : 26)
      doc.setTextColor(0, 0, 0)
      doc.setFont(isClassic ? "times" : "helvetica", "normal")
      const quoteLines = doc.splitTextToSize(entry.text, textWidth)
      const quoteHeight = quoteLines.length * (isClassic ? 28 : 32)
      const quoteStartY = centerY - quoteHeight / 2 - 30

      doc.text(quoteLines, width / 2, quoteStartY, {
        align: "center",
        maxWidth: textWidth,
      })

      // Author
      if (person) {
        doc.setFontSize(12)
        doc.setTextColor(102, 102, 102)
        doc.setFont("helvetica", "bold")
        doc.text(`— ${person.display_name}`, width / 2, quoteStartY + quoteHeight + 20, {
          align: "center",
          maxWidth: textWidth,
        })
      }

      // Date
      doc.setFontSize(9)
      doc.setTextColor(153, 153, 153)
      doc.setFont("helvetica", "normal")
      doc.text(
        formatDate(entry.entry_date),
        width / 2,
        quoteStartY + quoteHeight + (person ? 40 : 20),
        {
          align: "center",
          maxWidth: textWidth,
        }
      )
    } else {
      // Body text style
      let yPos = margin + 20

      // Subtle divider line
      doc.setDrawColor(229, 229, 229)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos - 20, width - margin, yPos - 20)

      // Author
      if (person) {
        doc.setFontSize(11)
        doc.setTextColor(102, 102, 102)
        doc.setFont("helvetica", "bold")
        doc.text(person.display_name, margin, yPos, { maxWidth: contentWidth })
        yPos += 20
      }

      // Entry text
      doc.setFontSize(isClassic ? 13 : 15)
      doc.setTextColor(0, 0, 0)
      doc.setFont(isClassic ? "times" : "helvetica", "normal")
      const textLines = doc.splitTextToSize(entry.text, contentWidth)
      doc.text(textLines, margin, yPos, { maxWidth: contentWidth, lineHeightFactor: 1.8 })
      yPos += textLines.length * (isClassic ? 18 : 20) + 25

      // Tags
      if (entryTags.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(153, 153, 153)
        doc.setFont("helvetica", "normal")
        doc.text(entryTags.join(" • "), margin, yPos, { maxWidth: contentWidth })
        yPos += 18
      }

      // Date
      doc.setFontSize(9)
      doc.setTextColor(153, 153, 153)
      doc.setFont("helvetica", "normal")
      doc.text(formatDate(entry.entry_date), margin, yPos, { maxWidth: contentWidth })
    }
  }

  // Render month divider
  const renderMonthDivider = (monthKey: string) => {
    addPage()

    const [year, month] = monthKey.split("-")
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
    const monthName = monthNames[parseInt(month) - 1]

    const yPos = height / 2

    // Month title
    doc.setFontSize(24)
    doc.setTextColor(0, 0, 0)
    doc.setFont(isClassic ? "times" : "helvetica", "bold")
    doc.text(`${monthName} ${year}`, width / 2, yPos - 15, {
      align: "center",
      maxWidth: contentWidth,
    })

    // Subtle line
    const lineY = yPos + 25
    const lineWidth = 100
    const lineX = (width - lineWidth) / 2
    doc.setDrawColor(224, 224, 224)
    doc.setLineWidth(0.5)
    doc.line(lineX, lineY, lineX + lineWidth, lineY)
  }

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

  // Render pages
  renderCover()
  renderTitlePage()

  // Sort months chronologically and render
  const sortedMonths = Object.keys(entriesByMonth).sort()
  sortedMonths.forEach((monthKey) => {
    renderMonthDivider(monthKey)
    const monthEntries = entriesByMonth[monthKey]
    monthEntries.forEach((entry) => {
      const isShort = entry.text.length <= 180
      renderEntry(entry, isShort)
    })
  })

  // Return PDF as buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
  return pdfBuffer
}
