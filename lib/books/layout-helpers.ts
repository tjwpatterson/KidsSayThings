import type { BookPhoto, Entry, Layout, LayoutSlot, PageContentItem } from "@/lib/types"

type Orientation = "portrait" | "landscape" | "square"

const getOrientation = (width?: number | null, height?: number | null): Orientation => {
  if (!width || !height || width === height) return "square"
  return width > height ? "landscape" : "portrait"
}

const getSlotOrientation = (slot: LayoutSlot): Orientation => {
  if (slot.widthPct === slot.heightPct) return "square"
  return slot.widthPct > slot.heightPct ? "landscape" : "portrait"
}

const pickPhotoForSlot = ({
  slot,
  candidates,
  used,
}: {
  slot: LayoutSlot
  candidates: BookPhoto[]
  used: Set<string>
}) => {
  const slotOrientation = getSlotOrientation(slot)
  let fallback: BookPhoto | null = null

  for (const photo of candidates) {
    if (used.has(photo.id)) continue
    const orientation = getOrientation(photo.width, photo.height)
    if (!fallback) {
      fallback = photo
    }
    if (orientation === slotOrientation) {
      return photo
    }
    if (
      slotOrientation === "square" &&
      (orientation === "portrait" || orientation === "landscape")
    ) {
      return photo
    }
  }

  return fallback
}

export const autoAssignPhotosToSlots = ({
  layout,
  existingContent = [],
  availablePhotos,
}: {
  layout: Layout
  existingContent?: PageContentItem[]
  availablePhotos: BookPhoto[]
}): PageContentItem[] => {
  const slots = layout.slots.filter((slot) => slot.kind === "photo")
  const existingBySlot = new Map(
    existingContent
      .filter((item) => item.slotId && item.type === "photo")
      .map((item) => [item.slotId!, item])
  )

  const usedPhotoIds = new Set(
    existingContent.filter((item) => item.type === "photo").map((item) => item.id)
  )

  return slots.reduce<PageContentItem[]>((acc, slot) => {
    const preserved = existingBySlot.get(slot.id)
    if (preserved) {
      acc.push(preserved)
      return acc
    }

    const nextPhoto = pickPhotoForSlot({
      slot,
      candidates: availablePhotos,
      used: usedPhotoIds,
    })

    if (!nextPhoto) {
      return acc
    }

    usedPhotoIds.add(nextPhoto.id)

    acc.push({
      id: nextPhoto.id,
      type: "photo",
      pageSide: slot.pageSide,
      slotId: slot.id,
      position: {
        x: slot.xPct,
        y: slot.yPct,
        width: slot.widthPct,
        height: slot.heightPct,
      },
    })

    return acc
  }, [])
}

export const autoAssignEntriesToSlots = ({
  layout,
  existingContent = [],
  availableEntries,
}: {
  layout: Layout
  existingContent?: PageContentItem[]
  availableEntries: Entry[]
}): PageContentItem[] => {
  const slots = layout.slots.filter((slot) => slot.kind === "quote")
  const existingBySlot = new Map(
    existingContent
      .filter((item) => item.slotId && item.type === "quote")
      .map((item) => [item.slotId!, item])
  )

  const usedEntryIds = new Set(
    existingContent.filter((item) => item.type === "quote").map((item) => item.id)
  )

  let entryIndex = 0

  return slots.reduce<PageContentItem[]>((acc, slot) => {
    const preserved = existingBySlot.get(slot.id)
    if (preserved) {
      acc.push(preserved)
      return acc
    }

    while (entryIndex < availableEntries.length && usedEntryIds.has(availableEntries[entryIndex].id)) {
      entryIndex += 1
    }

    const nextEntry = availableEntries[entryIndex]

    if (!nextEntry) {
      return acc
    }

    usedEntryIds.add(nextEntry.id)
    entryIndex += 1

    acc.push({
      id: nextEntry.id,
      type: "quote",
      pageSide: slot.pageSide,
      slotId: slot.id,
      position: {
        x: slot.xPct,
        y: slot.yPct,
        width: slot.widthPct,
        height: slot.heightPct,
      },
    })

    return acc
  }, [])
}


