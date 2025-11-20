"use client"

import { useState } from "react"
import PersonSidebar from "./person-sidebar"
import QuickAddCard from "./quick-add-card"
import QuoteGrid from "./quote-grid"
import { ErrorBoundary } from "./error-boundary"

interface EntriesPageClientProps {
  householdId: string
}

export default function EntriesPageClient({ householdId }: EntriesPageClientProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (!householdId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar */}
        <ErrorBoundary>
          <PersonSidebar
            householdId={householdId}
            selectedPersonId={selectedPersonId}
            onPersonSelect={setSelectedPersonId}
          />
        </ErrorBoundary>

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

              <ErrorBoundary>
                <QuickAddCard
                  householdId={householdId}
                  selectedPersonId={selectedPersonId}
                  onPersonSelect={setSelectedPersonId}
                  onEntryAdded={() => setRefreshKey((k) => k + 1)}
                />
              </ErrorBoundary>

              <div className="mt-8">
                <ErrorBoundary>
                  <QuoteGrid
                    key={refreshKey}
                    householdId={householdId}
                    personId={selectedPersonId}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

