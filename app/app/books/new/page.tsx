"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

export default function NewBookPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageCount, setPageCount] = useState<24 | 40 | 60>(24)

  const handleCreateBook = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)

      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_start: oneYearAgo.toISOString().split("T")[0],
          date_end: today.toISOString().split("T")[0],
          title: null,
          size: "6x9",
          theme: "classic",
          cover_style: "linen",
          dedication: null,
          page_count: pageCount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create book")
      }

      const book = await response.json()

      // Redirect to design page
      router.push(`/app/books/${book.id}/design`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create book",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Book</CardTitle>
          <CardDescription>
            Choose how many pages you'd like in your book. You can always add more pages later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Number of Pages</label>
            <div className="grid grid-cols-3 gap-4">
              {([24, 40, 60] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => setPageCount(count)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    pageCount === count
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground mt-1">pages</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleCreateBook} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Book...
                </>
              ) : (
                "Create Book"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
