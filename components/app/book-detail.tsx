"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Loader2, Play, Trash2 } from "lucide-react"
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
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete book")
      }

      toast({
        title: "Book deleted",
        description: "The book has been permanently deleted.",
      })

      // Redirect to books list
      router.push("/app/books")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
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

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Book
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{book.title || "Untitled Book"}"? 
              This action cannot be undone and will permanently delete the book and its PDF.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



