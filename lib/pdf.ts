// PDF generation using pdfkit (no browser required)
import PDFDocument from "pdfkit"
import type { Book, Entry, Person } from "@/lib/types"
import { format } from "date-fns"

interface BookRenderOptions {
  book: Book
  entries: Entry[]
  persons: Record<string, Person>
  tags: Record<string, string[]>
}

export async function generateBookPDF({
  book,
  entries,
  persons,
  tags,
}: BookRenderOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Page dimensions in points (1 inch = 72 points)
      // 6x9 = 6" x 9" = 432pt x 648pt
      // 8x10 = 8" x 10" = 576pt x 720pt
      const dimensions = {
        "6x9": { width: 432, height: 648 },
        "8x10": { width: 576, height: 720 },
      }

      const size = dimensions[book.size]
      const theme = book.theme
      const isClassic = theme === "classic"

      // Create PDF document with larger margins for minimalist look
      // Configure for serverless environment
      const doc = new PDFDocument({
        size: [size.width, size.height],
        margin: 60, // Increased margins for more white space
        bufferPages: true, // Buffer pages for serverless
      })

      const chunks: Buffer[] = []
      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      // Font configuration
      const fonts = {
        serif: "Helvetica", // Classic theme
        sansSerif: "Helvetica", // Playful theme
        bold: "Helvetica-Bold",
      }

      // Helper to format dates
      const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return format(date, "MMMM d, yyyy")
      }

      // Render cover page - minimalist design
      const renderCover = () => {
        doc.addPage()

        // Minimalist cover - white or very light background
        if (book.cover_style === "gradient") {
          doc.rect(0, 0, size.width, size.height).fill("#fafafa")
        } else if (book.cover_style === "solid") {
          doc.rect(0, 0, size.width, size.height).fill("#000000")
        } else {
          // Linen - very light beige
          doc.rect(0, 0, size.width, size.height).fill("#fafafa")
        }

        const isDarkCover = book.cover_style === "solid"
        const textColor = isDarkCover ? "#ffffff" : "#000000"

        // Minimalist title - centered, large, clean
        const titleY = size.height / 2 - 40
        doc
          .font(fonts.bold)
          .fontSize(isClassic ? 42 : 48)
          .fillColor(textColor)
          .text(book.title || "SaySo", 60, titleY, {
            align: "center",
            width: size.width - 120,
          })

        // Subtle date/year below title
        const subtitle =
          new Date(book.date_start).getFullYear() ===
          new Date(book.date_end).getFullYear()
            ? String(new Date(book.date_start).getFullYear())
            : `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`

        doc
          .font(fonts.sansSerif)
          .fontSize(14)
          .fillColor(isDarkCover ? "#cccccc" : "#666666")
          .text(subtitle, 60, titleY + 70, {
            align: "center",
            width: size.width - 120,
          })

        // Minimal footer - very subtle
        doc
          .fontSize(10)
          .fillColor(isDarkCover ? "#888888" : "#999999")
          .opacity(0.6)
          .text("A Collection of Memories", 60, size.height - 80, {
            align: "center",
            width: size.width - 120,
          })
      }

      // Render title page - clean and minimal
      const renderTitlePage = () => {
        doc.addPage()

        // Title - large, centered, minimal
        const titleY = size.height / 2 - 80
        doc
          .font(fonts.bold)
          .fontSize(isClassic ? 36 : 40)
          .fillColor("#000000")
          .text(book.title || "SaySo", 60, titleY, {
            align: "center",
            width: size.width - 120,
          })

        // Date range - subtle, smaller
        doc
          .font(fonts.sansSerif)
          .fontSize(12)
          .fillColor("#666666")
          .text(
            `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`,
            60,
            titleY + 60,
            {
              align: "center",
              width: size.width - 120,
            }
          )

        // Dedication - elegant, centered
        if (book.dedication) {
          doc
            .fontSize(13)
            .font(fonts.serif)
            .fillColor("#333333")
            .text(book.dedication, 90, titleY + 120, {
              align: "center",
              width: size.width - 180,
              lineGap: 4,
            })
        }
      }

      // Render entry - minimalist quote style
      const renderEntry = (entry: Entry, isShort: boolean) => {
        doc.addPage()
        const person = entry.said_by ? persons[entry.said_by] : null
        const entryTags = tags[entry.id] || []

        if (isShort && entry.text.length <= 180) {
          // Minimalist pull quote - lots of white space
          const centerY = size.height / 2
          const textWidth = size.width - 180 // More margin for minimalism

          // Quote text - large, centered, elegant
          const quoteFontSize = isClassic ? 22 : 26
          const textHeight = doc.heightOfString(entry.text, {
            width: textWidth,
            lineGap: 10,
          })

          doc
            .font(isClassic ? fonts.serif : fonts.sansSerif)
            .fontSize(quoteFontSize)
            .fillColor("#000000")
            .text(entry.text, 90, centerY - textHeight / 2 - 30, {
              align: "center",
              width: textWidth,
              lineGap: 10,
            })

          // Author - subtle, below quote
          if (person) {
            doc
              .font(fonts.bold)
              .fontSize(12)
              .fillColor("#666666")
              .text(person.display_name, 90, centerY + textHeight / 2 + 20, {
                align: "center",
                width: textWidth,
              })
          }

          // Date - very subtle, small
          doc
            .fontSize(9)
            .fillColor("#999999")
            .text(formatDate(entry.entry_date), 90, centerY + textHeight / 2 + (person ? 40 : 20), {
              align: "center",
              width: textWidth,
            })
        } else {
          // Body text style - clean, readable
          let yPos = 80

          // Subtle divider line at top (optional, very light)
          doc
            .strokeColor("#e5e5e5")
            .lineWidth(0.5)
            .moveTo(60, yPos - 20)
            .lineTo(size.width - 60, yPos - 20)
            .stroke()

          // Author - small, subtle
          if (person) {
            doc
              .font(fonts.bold)
              .fontSize(11)
              .fillColor("#666666")
              .text(person.display_name, 60, yPos, {
                width: size.width - 120,
              })
            yPos += 20
          }

          // Entry text - clean, readable, good spacing
          const entryTextHeight = doc.heightOfString(entry.text, {
            width: size.width - 120,
            lineGap: 8,
          })
          doc
            .font(isClassic ? fonts.serif : fonts.sansSerif)
            .fontSize(isClassic ? 13 : 15)
            .fillColor("#000000")
            .text(entry.text, 60, yPos, {
              width: size.width - 120,
              lineGap: 8,
            })

          yPos += entryTextHeight + 25

          // Tags - very subtle
          if (entryTags.length > 0) {
            doc
              .fontSize(9)
              .fillColor("#999999")
              .text(entryTags.map((tag) => tag).join(" • "), 60, yPos, {
                width: size.width - 120,
              })
            yPos += 18
          }

          // Date - minimal, bottom
          doc
            .fontSize(9)
            .fillColor("#999999")
            .text(formatDate(entry.entry_date), 60, yPos, {
              width: size.width - 120,
            })
        }
      }

      // Render month divider - minimalist
      const renderMonthDivider = (monthKey: string) => {
        doc.addPage()

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

        // Minimalist divider - just text, centered
        const yPos = size.height / 2

        // Month title - clean, minimal
        doc
          .font(fonts.bold)
          .fontSize(24)
          .fillColor("#000000")
          .text(`${monthName} ${year}`, 60, yPos - 15, {
            align: "center",
            width: size.width - 120,
          })

        // Very subtle line - minimal
        const lineY = yPos + 25
        const lineWidth = 100
        const lineX = (size.width - lineWidth) / 2
        doc
          .strokeColor("#e0e0e0")
          .lineWidth(0.5)
          .moveTo(lineX, lineY)
          .lineTo(lineX + lineWidth, lineY)
          .stroke()
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

      // Finalize PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
