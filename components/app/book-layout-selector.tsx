"use client"

import { Button } from "@/components/ui/button"
import type { PageLayout } from "@/lib/types"

interface BookLayoutSelectorProps {
  selected: PageLayout | null
  onSelect: (layout: PageLayout | null) => void
  type: "photo" | "quote"
}

export default function BookLayoutSelector({
  selected,
  onSelect,
  type,
}: BookLayoutSelectorProps) {
  const options =
    type === "photo"
      ? [
          { value: "A" as PageLayout, label: "Option A: 1 Photo (fullpage)" },
          { value: "B" as PageLayout, label: "Option B: 2 photos (top & bottom)" },
          {
            value: "C" as PageLayout,
            label: "Option C: 1 Photo (top) and 1 quote (bottom)",
          },
        ]
      : [
          { value: "A" as PageLayout, label: "Option A: 1 quote (centered on page)" },
          { value: "B" as PageLayout, label: "Option B: 2 quotes (top & bottom)" },
          {
            value: "C" as PageLayout,
            label: "Option C: 1 Photo (top) and 1 quote (bottom)",
          },
        ]

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? "default" : "outline"}
          className="w-full justify-start text-left h-auto py-2"
          onClick={() => onSelect(selected === option.value ? null : option.value)}
        >
          <span className="text-sm">{option.label}</span>
        </Button>
      ))}
    </div>
  )
}

