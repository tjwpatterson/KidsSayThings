"use client"

import type { BookThemeConfig } from "@/lib/types"

interface ThemePreviewCardProps {
  theme: BookThemeConfig
  isSelected: boolean
  onClick: () => void
}

export default function ThemePreviewCard({
  theme,
  isSelected,
  onClick,
}: ThemePreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-primary shadow-lg bg-primary/5"
          : "border-border hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <div className="space-y-3">
        {/* Theme Name */}
        <div className="font-semibold text-base">{theme.name}</div>

        {/* Color Preview */}
        <div className="flex gap-2">
          <div
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>

        {/* Font Preview */}
        <div className="space-y-1">
          <div
            className="text-sm font-semibold"
            style={{
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
            }}
          >
            Heading Font
          </div>
          <div
            className="text-xs"
            style={{
              fontFamily: theme.fonts.body,
              color: theme.colors.text,
              opacity: 0.8,
            }}
          >
            Body font preview text
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Selected
          </div>
        )}
      </div>
    </button>
  )
}

