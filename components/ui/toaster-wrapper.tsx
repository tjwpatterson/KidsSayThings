"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import Toaster with SSR disabled
const Toaster = dynamic(
  () => import("./toaster").then((mod) => ({ default: mod.Toaster })),
  {
    ssr: false,
  }
)

export default function ToasterWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted
  if (!mounted) {
    return null
  }

  return <Toaster />
}

