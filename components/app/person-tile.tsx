"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPersonColor, getFirstName } from "@/lib/utils"
import type { Person } from "@/lib/types"
import { motion } from "framer-motion"

interface PersonTileProps {
  person: Person
  isActive?: boolean
  onClick: () => void
}

export default function PersonTile({ person, isActive = false, onClick }: PersonTileProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!person || !person.id || !person.display_name) {
    return null
  }
  
  const tileColor = getPersonColor(person.id)
  const firstName = getFirstName(person.display_name)

  const buttonContent = (
    <>
      <Avatar className="h-8 w-8 border-2 border-white/50 shrink-0">
        <AvatarImage src={person.avatar_url || undefined} />
        <AvatarFallback
          className="text-sm font-medium"
          style={{
            backgroundColor: tileColor,
            color: "white",
          }}
        >
          {firstName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm truncate flex-1">{firstName}</span>
      {isActive && mounted && (
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tileColor }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
      {isActive && !mounted && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tileColor }}
        />
      )}
    </>
  )

  if (!mounted) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
          isActive
            ? "bg-background shadow-sm border border-border"
            : "hover:bg-background/50 border border-transparent"
        }`}
        style={{
          backgroundColor: isActive ? undefined : `${tileColor}15`,
          borderColor: isActive ? undefined : `${tileColor}30`,
        }}
      >
        {buttonContent}
      </button>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
        isActive
          ? "bg-background shadow-sm border border-border"
          : "hover:bg-background/50 border border-transparent"
      }`}
      style={{
        backgroundColor: isActive ? undefined : `${tileColor}15`,
        borderColor: isActive ? undefined : `${tileColor}30`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {buttonContent}
    </motion.button>
  )
}

