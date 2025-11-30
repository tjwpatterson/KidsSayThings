import type { Layout } from "@/lib/types"

export const COVER_LAYOUTS: Layout[] = [
  {
    id: "cover-wrap-photo",
    name: "Wrap Photo",
    category: "cover",
    photoCount: 2,
    quoteCount: 0,
    slots: [
      {
        id: "cover-photo-back",
        kind: "photo",
        pageSide: "left",
        xPct: 0,
        yPct: 0,
        widthPct: 100,
        heightPct: 100,
      },
      {
        id: "cover-photo-front",
        kind: "photo",
        pageSide: "right",
        xPct: 0,
        yPct: 0,
        widthPct: 100,
        heightPct: 100,
      },
    ],
  },
  {
    id: "cover-photo-band",
    name: "Photo + Band",
    category: "cover",
    photoCount: 1,
    quoteCount: 0,
    slots: [
      {
        id: "cover-photo-front",
        kind: "photo",
        pageSide: "right",
        xPct: 0,
        yPct: 0,
        widthPct: 100,
        heightPct: 65,
      },
    ],
  },
  {
    id: "cover-mosaic",
    name: "Photo Mosaic",
    category: "cover",
    photoCount: 3,
    quoteCount: 0,
    slots: [
      {
        id: "cover-photo-front-large",
        kind: "photo",
        pageSide: "right",
        xPct: 0,
        yPct: 0,
        widthPct: 60,
        heightPct: 100,
      },
      {
        id: "cover-photo-front-top",
        kind: "photo",
        pageSide: "right",
        xPct: 65,
        yPct: 5,
        widthPct: 30,
        heightPct: 42,
      },
      {
        id: "cover-photo-front-bottom",
        kind: "photo",
        pageSide: "right",
        xPct: 65,
        yPct: 53,
        widthPct: 30,
        heightPct: 42,
      },
    ],
  },
]

const INTERIOR_PHOTO_LAYOUTS: Layout[] = [
  {
    id: "photo-1-full-bleed",
    name: "Full Bleed",
    category: "photo",
    photoCount: 1,
    quoteCount: 1,
    pairedQuoteLayoutId: "quote-1-centered",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 0,
        yPct: 0,
        widthPct: 100,
        heightPct: 100,
      },
    ],
  },
  {
    id: "photo-1-wide-border",
    name: "Wide Border",
    category: "photo",
    photoCount: 1,
    quoteCount: 1,
    pairedQuoteLayoutId: "quote-1-centered",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 10,
        yPct: 8,
        widthPct: 80,
        heightPct: 84,
      },
    ],
  },
  {
    id: "photo-1-upper-two-thirds",
    name: "Upper Two Thirds",
    category: "photo",
    photoCount: 1,
    quoteCount: 1,
    pairedQuoteLayoutId: "quote-1-centered",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 4,
        widthPct: 88,
        heightPct: 66,
      },
    ],
  },
  {
    id: "photo-1-small-centered",
    name: "Small Center",
    category: "photo",
    photoCount: 1,
    quoteCount: 1,
    pairedQuoteLayoutId: "quote-1-centered",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 20,
        yPct: 20,
        widthPct: 60,
        heightPct: 60,
      },
    ],
  },
  {
    id: "photo-2-stack",
    name: "Stacked",
    category: "photo",
    photoCount: 2,
    quoteCount: 2,
    pairedQuoteLayoutId: "quote-2-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 8,
        yPct: 4,
        widthPct: 84,
        heightPct: 42,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 8,
        yPct: 54,
        widthPct: 84,
        heightPct: 42,
      },
    ],
  },
  {
    id: "photo-2-columns",
    name: "Columns",
    category: "photo",
    photoCount: 2,
    quoteCount: 2,
    pairedQuoteLayoutId: "quote-2-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 8,
        widthPct: 40,
        heightPct: 84,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 54,
        yPct: 8,
        widthPct: 40,
        heightPct: 84,
      },
    ],
  },
  {
    id: "photo-2-emphasis",
    name: "Large + Small",
    category: "photo",
    photoCount: 2,
    quoteCount: 2,
    pairedQuoteLayoutId: "quote-2-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 6,
        widthPct: 70,
        heightPct: 82,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 78,
        yPct: 50,
        widthPct: 16,
        heightPct: 36,
      },
    ],
  },
  {
    id: "photo-3-stack",
    name: "Three Stack",
    category: "photo",
    photoCount: 3,
    quoteCount: 3,
    pairedQuoteLayoutId: "quote-3-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 10,
        yPct: 4,
        widthPct: 80,
        heightPct: 28,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 10,
        yPct: 36,
        widthPct: 80,
        heightPct: 28,
      },
      {
        id: "left-photo-3",
        kind: "photo",
        pageSide: "left",
        xPct: 10,
        yPct: 68,
        widthPct: 80,
        heightPct: 28,
      },
    ],
  },
  {
    id: "photo-3-large-top",
    name: "Hero + Pair",
    category: "photo",
    photoCount: 3,
    quoteCount: 3,
    pairedQuoteLayoutId: "quote-3-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 8,
        yPct: 6,
        widthPct: 84,
        heightPct: 45,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 8,
        yPct: 56,
        widthPct: 40,
        heightPct: 34,
      },
      {
        id: "left-photo-3",
        kind: "photo",
        pageSide: "left",
        xPct: 52,
        yPct: 56,
        widthPct: 40,
        heightPct: 34,
      },
    ],
  },
  {
    id: "photo-4-grid",
    name: "Grid",
    category: "photo",
    photoCount: 4,
    quoteCount: 3,
    pairedQuoteLayoutId: "quote-3-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 6,
        widthPct: 40,
        heightPct: 40,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 52,
        yPct: 6,
        widthPct: 40,
        heightPct: 40,
      },
      {
        id: "left-photo-3",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 52,
        widthPct: 40,
        heightPct: 40,
      },
      {
        id: "left-photo-4",
        kind: "photo",
        pageSide: "left",
        xPct: 52,
        yPct: 52,
        widthPct: 40,
        heightPct: 40,
      },
    ],
  },
  {
    id: "photo-4-hero-grid",
    name: "Hero + Trio",
    category: "photo",
    photoCount: 4,
    quoteCount: 3,
    pairedQuoteLayoutId: "quote-3-stack",
    slots: [
      {
        id: "left-photo-1",
        kind: "photo",
        pageSide: "left",
        xPct: 6,
        yPct: 6,
        widthPct: 60,
        heightPct: 60,
      },
      {
        id: "left-photo-2",
        kind: "photo",
        pageSide: "left",
        xPct: 70,
        yPct: 6,
        widthPct: 24,
        heightPct: 24,
      },
      {
        id: "left-photo-3",
        kind: "photo",
        pageSide: "left",
        xPct: 70,
        yPct: 36,
        widthPct: 24,
        heightPct: 24,
      },
      {
        id: "left-photo-4",
        kind: "photo",
        pageSide: "left",
        xPct: 20,
        yPct: 70,
        widthPct: 60,
        heightPct: 24,
      },
    ],
  },
]

const INTERIOR_QUOTE_LAYOUTS: Layout[] = [
  {
    id: "quote-1-centered",
    name: "Centered",
    category: "quote",
    photoCount: 0,
    quoteCount: 1,
    slots: [
      {
        id: "right-quote-1",
        kind: "quote",
        pageSide: "right",
        xPct: 20,
        yPct: 20,
        widthPct: 60,
        heightPct: 60,
      },
    ],
  },
  {
    id: "quote-2-stack",
    name: "Two Stack",
    category: "quote",
    photoCount: 0,
    quoteCount: 2,
    slots: [
      {
        id: "right-quote-1",
        kind: "quote",
        pageSide: "right",
        xPct: 15,
        yPct: 10,
        widthPct: 70,
        heightPct: 35,
      },
      {
        id: "right-quote-2",
        kind: "quote",
        pageSide: "right",
        xPct: 15,
        yPct: 55,
        widthPct: 70,
        heightPct: 35,
      },
    ],
  },
  {
    id: "quote-3-stack",
    name: "Three Stack",
    category: "quote",
    photoCount: 0,
    quoteCount: 3,
    slots: [
      {
        id: "right-quote-1",
        kind: "quote",
        pageSide: "right",
        xPct: 12,
        yPct: 6,
        widthPct: 76,
        heightPct: 26,
      },
      {
        id: "right-quote-2",
        kind: "quote",
        pageSide: "right",
        xPct: 12,
        yPct: 36,
        widthPct: 76,
        heightPct: 26,
      },
      {
        id: "right-quote-3",
        kind: "quote",
        pageSide: "right",
        xPct: 12,
        yPct: 66,
        widthPct: 76,
        heightPct: 26,
      },
    ],
  },
]

export const ALL_LAYOUTS: Layout[] = [
  ...COVER_LAYOUTS,
  ...INTERIOR_PHOTO_LAYOUTS,
  ...INTERIOR_QUOTE_LAYOUTS,
]

export const LAYOUTS_BY_ID = ALL_LAYOUTS.reduce<Record<string, Layout>>((acc, layout) => {
  acc[layout.id] = layout
  return acc
}, {})

export const getPhotoLayouts = (count: number) =>
  INTERIOR_PHOTO_LAYOUTS.filter((layout) => layout.photoCount === count)

export const getQuoteLayouts = (count: number) =>
  INTERIOR_QUOTE_LAYOUTS.filter((layout) => layout.quoteCount === count)

export const getCoverLayouts = () => COVER_LAYOUTS

export const QUOTE_LAYOUT_BY_COUNT: Record<number, string> = {
  1: "quote-1-centered",
  2: "quote-2-stack",
  3: "quote-3-stack",
}

export const DEFAULT_INTERIOR_PHOTO_LAYOUT_ID = "photo-1-full-bleed"
export const DEFAULT_INTERIOR_QUOTE_LAYOUT_ID = "quote-1-centered"

export const getQuoteLayoutIdForCount = (count: number) => {
  if (count <= 1) return QUOTE_LAYOUT_BY_COUNT[1]
  if (count === 2) return QUOTE_LAYOUT_BY_COUNT[2]
  return QUOTE_LAYOUT_BY_COUNT[3]
}

