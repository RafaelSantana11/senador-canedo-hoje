"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type SearchContextValue = {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <SearchContext value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error("useSearch must be used within SearchProvider")
  return ctx
}