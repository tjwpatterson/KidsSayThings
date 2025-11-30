"use client"

import { Image, Quote, LayoutGrid, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

type SidebarTab = "photos" | "quotes" | "layouts" | "settings"

interface BookLeftSidebarProps {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
}

export default function BookLeftSidebar({
  activeTab,
  onTabChange,
}: BookLeftSidebarProps) {
  const tabs: { id: SidebarTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: "photos", icon: Image, label: "Photos" },
    { id: "quotes", icon: Quote, label: "Quotes" },
    { id: "layouts", icon: LayoutGrid, label: "Layouts" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-lg transition-colors relative group",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
            title={tab.label}
          >
            <Icon className="h-5 w-5" />
            {activeTab === tab.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}

