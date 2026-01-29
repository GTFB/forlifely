"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type AdminFilter = {
  field: string
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in"
  value: unknown
}

export type AdminState = {
  collection: string
  page: number
  pageSize: number
  filters: AdminFilter[]
  search: string
}

const DEFAULT_STATE: AdminState = {
  collection: "users",
  page: 1,
  pageSize: 20,
  filters: [],
  search: "",
}

const AdminStateContext = createContext<{
  state: AdminState
  setState: (updater: (prev: AdminState) => AdminState) => void
  replaceState: (next: AdminState) => void
  pushState: (next: Partial<AdminState>) => void
}>({ 
  state: DEFAULT_STATE, 
  setState: () => {}, 
  replaceState: () => {},
  pushState: () => {},
})

export function AdminStateProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const parseStateFromSearch = useCallback((): AdminState => {
    // Check if we're on editor page and set default collection to products
    const isEditorPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/editor')
    const defaultCollection = isEditorPage ? 'products' : DEFAULT_STATE.collection
    
    const collection = searchParams.get("c") || defaultCollection
    const page = Math.max(1, Number(searchParams.get("p") || DEFAULT_STATE.page))
    const pageSize = Math.max(1, Number(searchParams.get("ps") || DEFAULT_STATE.pageSize))
    const search = searchParams.get("s") || DEFAULT_STATE.search
    const filtersParam = searchParams.get("f")
    let filters: AdminFilter[] = []
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam)
        if (Array.isArray(parsed)) {
          filters = parsed.filter((f) => f && typeof f.field === "string")
        }
      } catch {}
    }
    return { collection, page, pageSize, filters, search }
  }, [searchParams])

  const [state, _setState] = useState<AdminState>(() => parseStateFromSearch())
  const pendingUrlUpdate = useRef<{ state: AdminState; method: "replace" | "push" } | null>(null)
  const isUpdatingFromUrl = useRef(false)
  const [urlUpdateVersion, setUrlUpdateVersion] = useState(0)

  // Update document title based on collection
  useEffect(() => {
    document.title = `${state.collection} - Admin Panel`
  }, [state.collection])

  useEffect(() => {
    // When URL changes (e.g., back/forward), sync state
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false
      return
    }
    const next = parseStateFromSearch()
    _setState((prev) => {
      const changed = JSON.stringify(prev) !== JSON.stringify(next)
      return changed ? next : prev
    })
  }, [parseStateFromSearch])

  // Sync URL when state changes (but not when updating from URL)
  useEffect(() => {
    if (pendingUrlUpdate.current && !isUpdatingFromUrl.current && urlUpdateVersion > 0) {
      const { state: nextState, method } = pendingUrlUpdate.current
      pendingUrlUpdate.current = null
      
      const params = new URLSearchParams()
      params.set("c", nextState.collection)
      params.set("p", String(nextState.page))
      params.set("ps", String(nextState.pageSize))
      if (nextState.search) params.set("s", nextState.search)
      if (nextState.filters.length) params.set("f", JSON.stringify(nextState.filters))
      
      isUpdatingFromUrl.current = true
      // Use setTimeout to defer router update to next tick (after render)
      setTimeout(() => {
        if (method === "push") {
          router.push(`${pathname}?${params.toString()}`)
        } else {
          router.replace(`${pathname}?${params.toString()}`)
        }
      }, 0)
    }
  }, [urlUpdateVersion, pathname, router])


  const setState = useCallback((updater: (prev: AdminState) => AdminState) => {
    _setState((prev) => {
      const next = updater(prev)
      // Schedule URL update for next effect
      pendingUrlUpdate.current = { state: next, method: "replace" }
      setUrlUpdateVersion((v) => v + 1)
      return next
    })
  }, [])


  // Push state with history entry (for navigation)
  const pushState = useCallback((partial: Partial<AdminState>) => {
    _setState((prev) => {
      const next = { ...prev, ...partial }
      // Schedule URL update for next effect
      pendingUrlUpdate.current = { state: next, method: "push" }
      setUrlUpdateVersion((v) => v + 1)

      return next
    })
  }, [])

  const replaceState = useCallback((next: AdminState) => setState(() => next), [setState])

  const value = useMemo(() => ({ 
    state, 
    setState, 
    replaceState,
    pushState,
  }), [state, setState, replaceState, pushState])

  return (
    <AdminStateContext.Provider value={value}>
      {children}
    </AdminStateContext.Provider>
  )
}

export function useAdminState() {
  const ctx = useContext(AdminStateContext)
  return ctx
}
