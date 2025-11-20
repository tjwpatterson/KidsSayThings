"use client"

interface CoverStylePreviewProps {
  style: "linen" | "solid" | "gradient"
  isSelected: boolean
  onClick: () => void
}

const coverStyles = {
  linen: {
    name: "Linen",
    preview: "bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200",
    description: "Textured linen finish",
  },
  solid: {
    name: "Solid",
    preview: "bg-gradient-to-br from-slate-600 to-slate-700",
    description: "Solid color cover",
  },
  gradient: {
    name: "Gradient",
    preview: "bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400",
    description: "Colorful gradient",
  },
}

export default function CoverStylePreview({
  style,
  isSelected,
  onClick,
}: CoverStylePreviewProps) {
  const styleConfig = coverStyles[style]

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
        {/* Cover Preview */}
        <div className="relative">
          <div
            className={`w-full h-24 rounded-md ${styleConfig.preview} shadow-md`}
          >
            {/* Book spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-md" />
          </div>
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Style Name */}
        <div className="font-semibold text-sm">{styleConfig.name}</div>

        {/* Description */}
        <div className="text-xs text-muted-foreground">
          {styleConfig.description}
        </div>
      </div>
    </button>
  )
}

