"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

interface BookWizardProps {
  householdId: string
}

type Step = "range" | "theme" | "cover" | "dedication" | "preview"

export default function BookWizard({ householdId }: BookWizardProps) {
  const [step, setStep] = useState<Step>("range")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date_start: "",
    date_end: "",
    title: "",
    size: "6x9" as "6x9" | "8x10",
    theme: "classic" as "classic" | "playful",
    cover_style: "linen" as "linen" | "solid" | "gradient",
    dedication: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleNext = () => {
    if (step === "range") {
      if (!formData.date_start || !formData.date_end) {
        toast({
          title: "Error",
          description: "Please select both start and end dates",
          variant: "destructive",
        })
        return
      }
      setStep("theme")
    } else if (step === "theme") {
      setStep("cover")
    } else if (step === "cover") {
      setStep("dedication")
    } else if (step === "dedication") {
      setStep("preview")
    }
  }

  const handleBack = () => {
    if (step === "theme") {
      setStep("range")
    } else if (step === "cover") {
      setStep("theme")
    } else if (step === "dedication") {
      setStep("cover")
    } else if (step === "preview") {
      setStep("dedication")
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          household_id: householdId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to create book")
      }

      const book = await res.json()

      toast({
        title: "Book created!",
        description: "Your book is being generated. This may take a few minutes.",
      })

      router.push(`/app/books/${book.id}`)
      router.refresh()
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
    <Card>
      <CardHeader>
        <CardTitle>
          {step === "range" && "Step 1: Date Range"}
          {step === "theme" && "Step 2: Theme & Size"}
          {step === "cover" && "Step 3: Cover Style"}
          {step === "dedication" && "Step 4: Dedication"}
          {step === "preview" && "Step 5: Preview & Create"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "range" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date_start">Start Date</Label>
              <Input
                id="date_start"
                type="date"
                value={formData.date_start}
                onChange={(e) =>
                  setFormData({ ...formData, date_start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_end">End Date</Label>
              <Input
                id="date_end"
                type="date"
                value={formData.date_end}
                onChange={(e) =>
                  setFormData({ ...formData, date_end: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Book Title (Optional)</Label>
              <Input
                id="title"
                placeholder="2025 Family Memories"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {step === "theme" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={formData.theme}
                onValueChange={(value: "classic" | "playful") =>
                  setFormData({ ...formData, theme: value })
                }
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Serif)</SelectItem>
                  <SelectItem value="playful">Playful (Sans-serif)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Book Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value: "6x9" | "8x10") =>
                  setFormData({ ...formData, size: value })
                }
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="6x9">6&quot; x 9&quot;</SelectItem>
                <SelectItem value="8x10">8&quot; x 10&quot;</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "cover" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover_style">Cover Style</Label>
              <Select
                value={formData.cover_style}
                onValueChange={(value: "linen" | "solid" | "gradient") =>
                  setFormData({ ...formData, cover_style: value })
                }
              >
                <SelectTrigger id="cover_style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linen">Linen</SelectItem>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "dedication" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dedication">Dedication (Optional)</Label>
              <Textarea
                id="dedication"
                placeholder="For our wonderful family..."
                value={formData.dedication}
                onChange={(e) =>
                  setFormData({ ...formData, dedication: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p>
                <strong>Date Range:</strong> {formData.date_start} to{" "}
                {formData.date_end}
              </p>
              <p>
                <strong>Title:</strong> {formData.title || "Untitled Book"}
              </p>
              <p>
                <strong>Theme:</strong> {formData.theme}
              </p>
              <p>
                <strong>Size:</strong> {formData.size}
              </p>
              <p>
                <strong>Cover:</strong> {formData.cover_style}
              </p>
              {formData.dedication && (
                <p>
                  <strong>Dedication:</strong> {formData.dedication}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div>
            {step !== "range" && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/app/books">
              <Button variant="outline">Cancel</Button>
            </Link>
            {step !== "preview" ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating..." : "Create Book"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



