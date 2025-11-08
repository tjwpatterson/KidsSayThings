import { chromium } from "playwright"
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
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Set page size based on book size (in inches, converted to points)
  // 6x9 = 6" x 9" = 432pt x 648pt
  // 8x10 = 8" x 10" = 576pt x 720pt
  // Add 0.125" bleed on each side = 0.25" total = 18pt
  const dimensions = {
    "6x9": { width: 450, height: 666 }, // 432 + 18 bleed
    "8x10": { width: 594, height: 738 }, // 576 + 18 bleed
  }

  const size = dimensions[book.size]

  const html = generateBookHTML({
    book,
    entries,
    persons,
    tags,
    size,
  })

  await page.setContent(html, { waitUntil: "networkidle" })

  const pdf = await page.pdf({
    width: `${size.width}pt`,
    height: `${size.height}pt`,
    printBackground: true,
    preferCSSPageSize: false,
    margin: {
      top: "36pt", // 0.5" safe margin
      right: "36pt",
      bottom: "36pt",
      left: "36pt",
    },
  })

  await browser.close()

  return pdf
}

function generateBookHTML({
  book,
  entries,
  persons,
  tags,
  size,
}: BookRenderOptions & { size: { width: number; height: number } }): string {
  const theme = book.theme
  const isClassic = theme === "classic"

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

  let pageNumber = 1

  const renderCover = () => {
    const coverStyle =
      book.cover_style === "gradient"
        ? "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
        : book.cover_style === "solid"
        ? "background: #667eea;"
        : "background: #f5f5f5;"

    return `
      <div class="page cover-page" style="${coverStyle} color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80pt;">
        <h1 class="cover-title" style="font-size: 48pt; font-weight: bold; margin-bottom: 20pt; ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}">
          ${book.title || "SaySo"}
        </h1>
        <p class="cover-subtitle" style="font-size: 24pt; margin-bottom: 40pt; opacity: 0.9;">
          ${new Date(book.date_start).getFullYear() === new Date(book.date_end).getFullYear()
            ? new Date(book.date_start).getFullYear()
            : `${formatDate(book.date_start)} - ${formatDate(book.date_end)}`}
        </p>
        <p class="cover-footer" style="font-size: 14pt; opacity: 0.8; margin-top: auto;">
          A Collection of Memories
        </p>
      </div>
    `
  }

  const renderTitlePage = () => {
    return `
      <div class="page title-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80pt;">
        <h1 class="title-page-title" style="font-size: 36pt; font-weight: bold; margin-bottom: 20pt; ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}">
          ${book.title || "SaySo"}
        </h1>
        <p class="title-page-date" style="font-size: 18pt; margin-bottom: 40pt; color: #666;">
          ${formatDate(book.date_start)} - ${formatDate(book.date_end)}
        </p>
        ${book.dedication ? `<p class="dedication" style="font-size: 14pt; font-style: italic; color: #666; max-width: 400pt; line-height: 1.6;">${escapeHtml(book.dedication)}</p>` : ""}
      </div>
    `
  }

  const renderEntry = (entry: Entry, isShort: boolean) => {
    const person = entry.said_by ? persons[entry.said_by] : null
    const entryTags = tags[entry.id] || []

    if (isShort && entry.text.length <= 180) {
      // Pull quote style
      return `
        <div class="entry-page pull-quote" style="display: flex; flex-direction: column; justify-content: center; padding: 60pt;">
          <div class="quote-mark" style="font-size: 120pt; line-height: 1; opacity: 0.2; ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}">
            "
          </div>
          <p class="quote-text" style="font-size: ${isClassic ? "24pt" : "28pt"}; line-height: 1.6; margin-top: -40pt; margin-bottom: 30pt; ${isClassic ? 'font-family: "Georgia", serif;' : 'font-family: "Inter", sans-serif;'}">
            ${escapeHtml(entry.text)}
          </p>
          ${person ? `<p class="quote-author" style="font-size: 18pt; font-weight: 600; ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}">— ${escapeHtml(person.display_name)}</p>` : ""}
          <p class="quote-date" style="font-size: 12pt; color: #999; margin-top: 10pt;">
            ${formatDate(entry.entry_date)}
          </p>
        </div>
      `
    } else {
      // Body text style
      return `
        <div class="entry-page body-text" style="padding: 60pt 50pt;">
          ${person ? `<p class="entry-author" style="font-size: 14pt; font-weight: 600; margin-bottom: 15pt; color: #666;">${escapeHtml(person.display_name)}</p>` : ""}
          <p class="entry-text" style="font-size: ${isClassic ? "14pt" : "16pt"}; line-height: 1.8; margin-bottom: 20pt; ${isClassic ? 'font-family: "Georgia", serif;' : 'font-family: "Inter", sans-serif;'}">
            ${escapeHtml(entry.text)}
          </p>
          ${entryTags.length > 0 ? `<div class="entry-tags" style="margin-top: 15pt; font-size: 11pt; color: #999;">${entryTags.map(tag => `#${escapeHtml(tag)}`).join(" ")}</div>` : ""}
          <p class="entry-date" style="font-size: 11pt; color: #999; margin-top: 15pt;">
            ${formatDate(entry.entry_date)}
          </p>
        </div>
      `
    }
  }

  const renderMonthDivider = (monthKey: string) => {
    const [year, month] = monthKey.split("-")
    const monthName = monthNames[parseInt(month) - 1]
    return `
      <div class="page month-divider" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60pt;">
        <h2 class="month-title" style="font-size: 32pt; font-weight: 600; margin-bottom: 15pt; ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}">
          ${monthName} ${year}
        </h2>
        <div class="divider-line" style="width: 200pt; height: 2pt; background: #ddd; margin: 20pt 0;"></div>
      </div>
    `
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        @page {
          size: ${size.width}pt ${size.height}pt;
          margin: 0;
        }
        .page {
          width: ${size.width}pt;
          height: ${size.height}pt;
          page-break-after: always;
          box-sizing: border-box;
        }
        .page:last-child {
          page-break-after: auto;
        }
        .page-number {
          position: absolute;
          bottom: 30pt;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10pt;
          color: #999;
          ${isClassic ? 'font-family: "Playfair Display", serif;' : 'font-family: "Inter", sans-serif;'}
        }
        body {
          margin: 0;
          padding: 0;
          ${isClassic ? 'font-family: "Georgia", serif;' : 'font-family: "Inter", sans-serif;'}
        }
      </style>
    </head>
    <body>
      ${renderCover()}
      ${renderTitlePage()}
  `

  // Sort months chronologically
  const sortedMonths = Object.keys(entriesByMonth).sort()

  sortedMonths.forEach((monthKey) => {
    html += renderMonthDivider(monthKey)
    const monthEntries = entriesByMonth[monthKey]
    monthEntries.forEach((entry) => {
      const isShort = entry.text.length <= 180
      html += renderEntry(entry, isShort)
      pageNumber++
    })
  })

  html += `
    </body>
    </html>
  `

  return html
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return format(date, "MMMM d, yyyy")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

