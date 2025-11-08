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

      // Create PDF document
      const doc = new PDFDocument({
        size: [size.width, size.height],
        margin: 36,
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

      // Render cover page
      const renderCover = () => {
        doc.addPage()

        // Background color based on cover style
        if (book.cover_style === "gradient") {
          // For gradient, we'll use a solid color (pdfkit doesn't support gradients easily)
          doc.rect(0, 0, size.width, size.height).fill("#667eea")
        } else if (book.cover_style === "solid") {
          doc.rect(0, 0, size.width, size.height).fill("#667eea")
        } else {
          doc.rect(0, 0, size.width, size.height).fill("#f5f5f5")
        }

        // Title
        doc
          .font(fonts.bold)
          .fontSize(48)
          .fillColor("#ffffff")
          .text(book.title || "SaySo", {
            align: "center",
            width: size.width - 72,
            x: 36,
            y: size.height / 2 - 60,
          })

        // Subtitle (year or date range)
        const subtitle =
          new Date(book.date_start).getFullYear() ===
          new Date(book.date_end).getFullYear()
            ? String(new Date(book.date_start).getFullYear())
            : `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`

        doc
          .fontSize(24)
          .fillColor("#ffffff")
          .opacity(0.9)
          .text(subtitle, {
            align: "center",
            width: size.width - 72,
            x: 36,
            y: size.height / 2 + 20,
          })

        // Footer
        doc
          .fontSize(14)
          .opacity(0.8)
          .text("A Collection of Memories", {
            align: "center",
            width: size.width - 72,
            x: 36,
            y: size.height - 100,
          })
      }

      // Render title page
      const renderTitlePage = () => {
        doc.addPage()

        doc.fillColor("#000000")

        // Title
        doc
          .font(fonts.bold)
          .fontSize(36)
          .fillColor("#000000")
          .text(book.title || "SaySo", {
            align: "center",
            width: size.width - 72,
            x: 36,
            y: size.height / 2 - 60,
          })

        // Date range
        doc
          .font(fonts.sansSerif)
          .fontSize(18)
          .fillColor("#666666")
          .text(
            `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`,
            {
              align: "center",
              width: size.width - 72,
              x: 36,
              y: size.height / 2 + 20,
            }
          )

        // Dedication
        if (book.dedication) {
          doc
            .fontSize(14)
            .font(fonts.serif)
            .fillColor("#666666")
            .text(book.dedication, {
              align: "center",
              width: size.width - 144,
              x: 72,
              y: size.height / 2 + 100,
            })
        }
      }

      // Render entry
      const renderEntry = (entry: Entry, isShort: boolean) => {
        doc.addPage()
        const person = entry.said_by ? persons[entry.said_by] : null
        const entryTags = tags[entry.id] || []

        doc.fillColor("#000000")

        if (isShort && entry.text.length <= 180) {
          // Pull quote style
          const yStart = size.height / 2 - 100

          // Large quote mark
          doc
            .font(fonts.bold)
            .fontSize(120)
            .fillColor("#cccccc")
            .opacity(0.2)
            .text('"', {
              x: 36,
              y: yStart - 40,
            })

          // Quote text
          const textHeight = doc.heightOfString(entry.text, {
            width: size.width - 72,
            lineGap: 8,
          })
          doc
            .font(isClassic ? fonts.serif : fonts.sansSerif)
            .fontSize(isClassic ? 24 : 28)
            .fillColor("#000000")
            .opacity(1)
            .text(entry.text, {
              x: 36,
              y: yStart + 40,
              width: size.width - 72,
              lineGap: 8,
            })

          // Author
          if (person) {
            doc
              .font(fonts.bold)
              .fontSize(18)
              .text(`— ${person.display_name}`, {
                x: 36,
                y: yStart + 40 + textHeight + 20,
                width: size.width - 72,
              })
          }

          // Date
          doc
            .fontSize(12)
            .fillColor("#999999")
            .text(formatDate(entry.entry_date), {
              x: 36,
              y: yStart + 40 + textHeight + (person ? 50 : 20),
              width: size.width - 72,
            })
        } else {
          // Body text style
          let yPos = 60

          // Author
          if (person) {
            doc
              .font(fonts.bold)
              .fontSize(14)
              .fillColor("#666666")
              .text(person.display_name, {
                x: 50,
                y: yPos,
                width: size.width - 100,
              })
            yPos += 25
          }

          // Entry text
          const entryTextHeight = doc.heightOfString(entry.text, {
            width: size.width - 100,
            lineGap: 6,
          })
          doc
            .font(isClassic ? fonts.serif : fonts.sansSerif)
            .fontSize(isClassic ? 14 : 16)
            .fillColor("#000000")
            .text(entry.text, {
              x: 50,
              y: yPos,
              width: size.width - 100,
              lineGap: 6,
            })

          yPos += entryTextHeight + 20

          // Tags
          if (entryTags.length > 0) {
            doc
              .fontSize(11)
              .fillColor("#999999")
              .text(entryTags.map((tag) => `#${tag}`).join(" "), {
                x: 50,
                y: yPos,
                width: size.width - 100,
              })
            yPos += 20
          }

          // Date
          doc
            .fontSize(11)
            .fillColor("#999999")
            .text(formatDate(entry.entry_date), {
              x: 50,
              y: yPos,
              width: size.width - 100,
            })
        }
      }

      // Render month divider
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

        const yPos = size.height / 2 - 40

          // Month title
        doc
          .font(fonts.bold)
          .fontSize(32)
          .fillColor("#000000")
          .text(`${monthName} ${year}`, {
            align: "center",
            width: size.width - 72,
            x: 36,
            y: yPos,
          })

        // Divider line
        const lineY = yPos + 50
        const lineWidth = 200
        const lineX = (size.width - lineWidth) / 2
        doc
          .strokeColor("#dddddd")
          .lineWidth(2)
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
