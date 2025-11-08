"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import type { Person } from "@/lib/types"

interface PeopleListProps {
  householdId: string
}

export default function PeopleList({ householdId }: PeopleListProps) {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadPersons()
  }, [householdId])

  const loadPersons = async () => {
    try {
      const { data, error } = await supabase
        .from("persons")
        .select("*")
        .eq("household_id", householdId)
        .order("display_name")

      if (error) throw error
      setPersons(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load people",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePerson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("display_name") as string

    try {
      const { data, error } = await supabase
        .from("persons")
        .insert({
          household_id: householdId,
          display_name: displayName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Person added!",
        description: `${displayName} has been added to your household.`,
      })

      setOpen(false)
      loadPersons()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create person",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Person</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Person</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {persons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No people added yet.</p>
          <p className="text-sm text-muted-foreground">
            Add your first person to start capturing quotes!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => (
            <Link key={person.id} href={`/app/people/${person.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={person.avatar_url || undefined} />
                      <AvatarFallback>
                        {person.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{person.display_name}</h3>
                      {person.birthdate && (
                        <p className="text-sm text-muted-foreground">
                          Born {new Date(person.birthdate).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}



