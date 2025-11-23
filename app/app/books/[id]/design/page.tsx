"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Force client-side only rendering - no SSR at all
const BookDesignPageClient = dynamic(
  () => import("@/components/app/book-design-page-client"),
  {
    ssr: false,
  }
)

export default function BookDesignPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return absolutely nothing until mounted to prevent any server rendering
  if (!mounted) {
    return null
  }

  return <BookDesignPageClient />
}
