"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Loader2 } from "lucide-react"

interface CSVImportFormProps {
  householdId: string
}

export default function CSVImportForm({ householdId }: CSVImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setProgress("Reading CSV file...")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        throw new Error("CSV file must have at least a header and one data row")
      }

      // Parse header
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const textIdx = headers.indexOf("text")
      const saidByIdx = headers.indexOf("said_by")
      const dateIdx = headers.indexOf("date")
      const tagsIdx = headers.indexOf("tags")
      const typeIdx = headers.indexOf("type")
      const notesIdx = headers.indexOf("notes")

      if (textIdx === -1) {
        throw new Error("CSV must have a 'text' column")
      }

      setProgress("Parsing entries...")

      // Parse rows
      const entries = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        const text = values[textIdx]
        if (!text || text.length === 0) continue

        if (text.length > 500) {
          toast({
            title: "Warning",
            description: `Row ${i + 1} has text longer than 500 characters, skipping`,
            variant: "destructive",
          })
          continue
        }

        entries.push({
          text,
          said_by: saidByIdx >= 0 ? values[saidByIdx] : null,
          date: dateIdx >= 0 ? values[dateIdx] : null,
          tags: tagsIdx >= 0 ? values[tagsIdx]?.split(",").map((t) => t.trim()).filter(Boolean) || [] : [],
          type: typeIdx >= 0 ? values[typeIdx] || "quote" : "quote",
          notes: notesIdx >= 0 ? values[notesIdx] : null,
        })
      }

      setProgress(`Importing ${entries.length} entries...`)

      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          household_id: householdId,
          entries,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to import CSV")
      }

      const result = await res.json()

      toast({
        title: "Import complete!",
        description: `Successfully imported ${result.created} entries.`,
      })

      setFile(null)
      setProgress("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              required
            />
            <p className="text-sm text-muted-foreground">
              Expected columns: text, said_by, date, tags, type, notes
            </p>
          </div>

          {progress && (
            <div className="p-3 bg-muted rounded-md text-sm">
              {progress}
            </div>
          )}

          <Button type="submit" disabled={loading || !file} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}





