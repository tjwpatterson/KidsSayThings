"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { Household } from "@/lib/types"

interface SettingsContentProps {
  household: Household & { role?: string }
}

export default function SettingsContent({ household }: SettingsContentProps) {
  const [householdName, setHouseholdName] = useState(household.name)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpdateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/households", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to update household")
      }

      toast({
        title: "Updated!",
        description: "Household name has been updated.",
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

  return (
    <Tabs defaultValue="household" className="space-y-6">
      <TabsList>
        <TabsTrigger value="household">Household</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="reminders">Reminders</TabsTrigger>
      </TabsList>

      <TabsContent value="household">
        <Card>
          <CardHeader>
            <CardTitle>Household Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateHousehold} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="householdName">Household Name</Label>
                <Input
                  id="householdName"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subscription">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage your subscription and billing.
            </p>
            <Button variant="outline" asChild>
              <Link href="/api/stripe/portal">Manage Subscription</Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reminders">
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Set up reminders to capture quotes regularly.
            </p>
            <p className="text-sm text-muted-foreground">
              Reminders feature coming soon!
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}




