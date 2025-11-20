"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export type DateRange = {
  start: Date | null
  end: Date | null
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const setPreset = (preset: "all" | "week" | "month" | "year") => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    switch (preset) {
      case "all":
        onChange({ start: null, end: null })
        break
      case "week":
        onChange({
          start: startOfWeek(today, { weekStartsOn: 0 }),
          end: endOfWeek(today, { weekStartsOn: 0 }),
        })
        break
      case "month":
        onChange({
          start: startOfMonth(today),
          end: endOfMonth(today),
        })
        break
      case "year":
        onChange({
          start: startOfYear(today),
          end: endOfYear(today),
        })
        break
    }
    setIsOpen(false)
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const dateStr = e.target.value
      const date = dateStr ? new Date(dateStr + "T00:00:00") : null
      if (date && isNaN(date.getTime())) {
        onChange({ ...value, start: null })
        return
      }
      onChange({ ...value, start: date })
    } catch (error) {
      console.error("Error parsing start date:", error)
      onChange({ ...value, start: null })
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const dateStr = e.target.value
      const date = dateStr ? new Date(dateStr + "T23:59:59") : null
      if (date && isNaN(date.getTime())) {
        onChange({ ...value, end: null })
        return
      }
      onChange({ ...value, end: date })
    } catch (error) {
      console.error("Error parsing end date:", error)
      onChange({ ...value, end: null })
    }
  }

  const formatDateRange = () => {
    try {
      if (!value.start && !value.end) return "All Time"
      if (value.start && value.end) {
        return `${format(value.start, "MMM d")} - ${format(value.end, "MMM d, yyyy")}`
      }
      if (value.start) return `From ${format(value.start, "MMM d, yyyy")}`
      if (value.end) return `Until ${format(value.end, "MMM d, yyyy")}`
      return "All Time"
    } catch (error) {
      return "All Time"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <Button
          type="button"
          variant={!value.start && !value.end ? "default" : "outline"}
          size="sm"
          onClick={() => setPreset("all")}
        >
          All Time
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset("week")}
        >
          This Week
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset("month")}
        >
          This Month
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreset("year")}
        >
          This Year
        </Button>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={value.start ? format(value.start, "yyyy-MM-dd") : ""}
                onChange={handleStartDateChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={value.end ? format(value.end, "yyyy-MM-dd") : ""}
                onChange={handleEndDateChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange({ start: null, end: null })
                  setIsOpen(false)
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

