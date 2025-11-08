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
  const [people, setPeople] = useState<string[]>([])
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

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!personName.trim()) return

    setLoading(true)

    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: personName.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to create person")
      }

      // Add to list and clear input
      setPeople([...people, personName.trim()])
      setPersonName("")
      
      toast({
        title: "Person added!",
        description: `${personName.trim()} has been added.`,
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

  const handleFinish = async () => {
    if (people.length === 0) {
      toast({
        title: "Add at least one person",
        description: "Please add at least one person before continuing.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "All set!",
      description: "Welcome to SaySo. Start capturing memories!",
    })

    router.push("/app")
    router.refresh()
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
        <CardTitle>Add People</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {people.length > 0 && (
          <div className="space-y-2">
            <Label>Added People ({people.length})</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((name, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleAddPerson} className="space-y-4">
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
              Add as many people as you&apos;d like. You can add more later from the People page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading || !personName.trim()}>
              {loading ? "Adding..." : "Add Person"}
            </Button>
            {people.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleFinish}
                disabled={loading}
              >
                Finish
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



