"use client"

import { useState } from "react"
import PersonSidebar from "./person-sidebar"
import QuickAddCard from "./quick-add-card"
import QuoteGrid from "./quote-grid"

interface EntriesPageClientProps {
  householdId: string
}

export default function EntriesPageClient({ householdId }: EntriesPageClientProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <PersonSidebar
        householdId={householdId}
        selectedPersonId={selectedPersonId}
        onPersonSelect={setSelectedPersonId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">Entries</h1>
              <p className="text-sm text-muted-foreground">
                Capture quotes and memories for each person
              </p>
            </div>

            <QuickAddCard
              householdId={householdId}
              selectedPersonId={selectedPersonId}
              onPersonSelect={setSelectedPersonId}
              onEntryAdded={() => setRefreshKey((k) => k + 1)}
            />

            <div className="mt-8">
              <QuoteGrid
                key={refreshKey}
                householdId={householdId}
                personId={selectedPersonId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

