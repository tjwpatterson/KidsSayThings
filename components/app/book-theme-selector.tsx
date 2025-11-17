"use client"

import { Button } from "@/components/ui/button"
import type { BookThemeConfig } from "@/lib/types"

interface BookThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
}

const themes: BookThemeConfig[] = [
  {
    id: "classic",
    name: "Classic",
    colors: {
      primary: "hsl(14, 90%, 58%)",
      secondary: "hsl(45, 93%, 94%)",
      accent: "hsl(14, 90%, 95%)",
      text: "hsl(240, 10%, 15%)",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Georgia",
    },
  },
  {
    id: "playful",
    name: "Playful",
    colors: {
      primary: "hsl(14, 90%, 58%)",
      secondary: "hsl(45, 93%, 94%)",
      accent: "hsl(14, 90%, 95%)",
      text: "hsl(240, 10%, 15%)",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
  {
    id: "modern",
    name: "Modern",
    colors: {
      primary: "hsl(220, 70%, 50%)",
      secondary: "hsl(220, 30%, 95%)",
      accent: "hsl(220, 50%, 90%)",
      text: "hsl(220, 20%, 20%)",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
  },
]

export default function BookThemeSelector({
  selectedTheme,
  onThemeChange,
}: BookThemeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Theme:</span>
      <div className="flex gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative border-2 rounded-lg p-3 transition-all ${
              selectedTheme === theme.id
                ? "border-primary shadow-md"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
              <span className="text-sm font-medium">{theme.name}</span>
            </div>
            {selectedTheme === theme.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

