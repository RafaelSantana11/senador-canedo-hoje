"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type CategoryContextValue = {
  selectedSlug: string | null
  setSelectedSlug: (slug: string | null) => void
}

const CategoryContext = createContext<CategoryContextValue | null>(null)

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  return (
    <CategoryContext value={{ selectedSlug, setSelectedSlug }}>
      {children}
    </CategoryContext>
  )
}

export function useSelectedCategory() {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error("useSelectedCategory must be used within CategoryProvider")
  return ctx
}
