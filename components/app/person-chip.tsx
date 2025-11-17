import { Badge } from "@/components/ui/badge"
import type { Person } from "@/lib/types"

interface PersonChipProps {
  person: Person
}

export function PersonChip({ person }: PersonChipProps) {
  return (
    <Badge variant="secondary" className="font-normal">
      {person.display_name}
    </Badge>
  )
}




