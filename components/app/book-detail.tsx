"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, Play } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import type { Book } from "@/lib/types"

interface BookDetailProps {
  book: Book
  householdId: string
}

export default function BookDetail({ book, householdId }: BookDetailProps) {
  const [rendering, setRendering] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleRender = async () => {
    setRendering(true)
    try {
      const res = await fetch(`/api/books/${book.id}/render`, {
        method: "POST",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to render book")
      }

      toast({
        title: "Book rendering started",
        description: "This may take a few minutes. Refresh to check status.",
      })

      // Refresh after a delay
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to render book",
        variant: "destructive",
      })
    } finally {
      setRendering(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/download`)
      if (!res.ok) throw new Error("Failed to get download URL")

      const { url } = await res.json()
      window.open(url, "_blank")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download book",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">
            {book.title || "Untitled Book"}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(book.date_start), "MMM d, yyyy")} -{" "}
            {format(new Date(book.date_end), "MMM d, yyyy")}
          </p>
        </div>
        <Link href="/app/books">
          <Button variant="outline">Back to Books</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={
                  book.status === "ready"
                    ? "default"
                    : book.status === "error"
                    ? "destructive"
                    : "secondary"
                }
                className="ml-2"
              >
                {book.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <span className="ml-2">{book.size}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Theme:</span>
              <span className="ml-2 capitalize">{book.theme}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cover:</span>
              <span className="ml-2 capitalize">{book.cover_style}</span>
            </div>
          </div>

          {book.dedication && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Dedication:</p>
              <p className="italic">{book.dedication}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {book.status === "draft" && (
              <Button onClick={handleRender} disabled={rendering}>
                {rendering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            )}

            {book.status === "rendering" && (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rendering...
              </Button>
            )}

            {book.status === "ready" && book.pdf_url && (
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}

            {book.status === "error" && (
              <Button onClick={handleRender} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



