"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function OnboardingForm() {
  const [step, setStep] = useState<"household" | "person">("household")
  const [householdName, setHouseholdName] = useState("")
  const [personName, setPersonName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to create household")
      }

      setStep("person")
      toast({
        title: "Household created!",
        description: "Now add your first person.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: personName }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to create person")
      }

      toast({
        title: "All set!",
        description: "Welcome to SaySo. Start capturing memories!",
      })

      router.push("/app")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === "household") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Household</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateHousehold} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                placeholder="The Smith Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Household"}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Your First Person</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreatePerson} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personName">Name</Label>
            <Input
              id="personName"
              placeholder="Emma"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              You can add more people later from the People page.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Person"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}



