"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import PersonTile from "./person-tile"
import type { Person } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

interface PersonSidebarProps {
  householdId: string
  selectedPersonId: string | null
  onPersonSelect: (personId: string | null) => void
}

export default function PersonSidebar({
  householdId,
  selectedPersonId,
  onPersonSelect,
}: PersonSidebarProps) {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadPersons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        description: `${displayName} has been added.`,
      })

      setOpen(false)
      loadPersons()
      
      // Auto-select the newly created person
      if (data) {
        onPersonSelect(data.id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create person",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-60 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">People</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
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
                    autoFocus
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
      </div>

      {/* Person tiles list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : persons.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground mb-2">No people yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first person to start capturing quotes!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {persons.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <PersonTile
                  person={person}
                  isActive={selectedPersonId === person.id}
                  onClick={() => onPersonSelect(person.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

