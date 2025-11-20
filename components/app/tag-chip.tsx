import { Badge } from "@/components/ui/badge"

interface TagChipProps {
  tag: string
}

export function TagChip({ tag }: TagChipProps) {
  return (
    <Badge variant="outline" className="font-normal">
      #{tag}
    </Badge>
  )
}





