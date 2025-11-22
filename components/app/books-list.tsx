"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Download, Loader2, Trash2, Edit, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import type { Book } from "@/lib/types"

interface BooksListProps {
  householdId: string
}

export default function BooksList({ householdId }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadBooks()
  }, [householdId])

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("household_id", householdId)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setBooks(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (bookId: string) => {
    try {
      const response = await fetch(`/api/books/${bookId}/download`)
      if (!response.ok) throw new Error("Failed to get download URL")

      const { url } = await response.json()
      window.open(url, "_blank")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download book",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (bookId: string) => {
    setDeleting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, {
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

      // Remove from list and refresh
      setBooks(books.filter((book) => book.id !== bookId))
      setShowDeleteDialog(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/app/books/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Book
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No books created yet.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first book to generate a beautiful print-ready PDF.
          </p>
          <Link href="/app/books/new">
            <Button>Create Your First Book</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <Card key={book.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  {book.title || "Untitled Book"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(book.date_start), "MMM yyyy")} -{" "}
                  {format(new Date(book.date_end), "MMM yyyy")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        book.status === "ready"
                          ? "default"
                          : book.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {book.status}
                    </Badge>
                  </div>
                  {book.updated_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Updated {formatDistanceToNow(new Date(book.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/app/books/${book.id}/design`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/app/books/${book.id}`}>
                      <Button variant="outline" size="icon" title="View details">
                        View
                      </Button>
                    </Link>
                    {book.status === "ready" && book.pdf_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(book.id)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {book.status === "rendering" && (
                      <Button variant="outline" size="icon" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowDeleteDialog(book.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete book"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this book? This action cannot be
              undone and will permanently delete the book and its PDF.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
              disabled={deleting !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteDialog && handleDelete(showDeleteDialog)
              }
              disabled={deleting !== null}
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

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: "default" | "secondary" | "destructive"
}) {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  }
  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}



