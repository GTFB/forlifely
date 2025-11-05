"use client"

import * as React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

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
  pageSize: 10,
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

function AdminStateProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const parseStateFromSearch = useCallback((): AdminState => {
    const collection = searchParams.get("c") || DEFAULT_STATE.collection
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
  const pendingUrlUpdateRef = React.useRef<string | null>(null)

  // Update document title based on collection
  useEffect(() => {
    document.title = `${state.collection} - Admin Panel`
  }, [state.collection])

  // Apply pending URL updates
  useEffect(() => {
    if (pendingUrlUpdateRef.current) {
      router.replace(pendingUrlUpdateRef.current)
      pendingUrlUpdateRef.current = null
    }
  }, [state, router])

  useEffect(() => {
    // When URL changes (e.g., back/forward), sync state
    const next = parseStateFromSearch()
    _setState((prev) => {
      const changed = JSON.stringify(prev) !== JSON.stringify(next)
      return changed ? next : prev
    })
  }, [parseStateFromSearch])

  const setState = useCallback((updater: (prev: AdminState) => AdminState) => {
    _setState((prev) => {
      const next = updater(prev)
      // Sync URL with replace (no history entry) - defer to useEffect to avoid render warnings
      const params = new URLSearchParams()
      params.set("c", next.collection)
      params.set("p", String(next.page))
      params.set("ps", String(next.pageSize))
      if (next.search) params.set("s", next.search)
      if (next.filters.length) params.set("f", JSON.stringify(next.filters))
      pendingUrlUpdateRef.current = `${pathname}?${params.toString()}`
      return next
    })
  }, [pathname, router])

  // Push state with history entry (for navigation)
  const pushState = useCallback((partial: Partial<AdminState>) => {
    _setState((prev) => {
      const next = { ...prev, ...partial }
      // Sync URL with push (creates history entry)
      const params = new URLSearchParams()
      params.set("c", next.collection)
      params.set("p", String(next.page))
      params.set("ps", String(next.pageSize))
      if (next.search) params.set("s", next.search)
      if (next.filters.length) params.set("f", JSON.stringify(next.filters))
      router.push(`${pathname}?${params.toString()}`)
      return next
    })
  }, [pathname, router])

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

export function AdminStateProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminStateProviderInner>{children}</AdminStateProviderInner>
    </Suspense>
  )
}

export function useAdminState() {
  const ctx = useContext(AdminStateContext)
  return ctx
}

// Hook to subscribe only to collection changes, not entire state
// This prevents re-renders when other parts of state change
export function useAdminCollection() {
  const ctx = useContext(AdminStateContext)
  const collectionRef = React.useRef(ctx.state.collection)
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  
  React.useEffect(() => {
      const checkCollection = () => {
        if (collectionRef.current !== ctx.state.collection) {
          collectionRef.current = ctx.state.collection
          forceUpdate()
        }
      }
      
      // Subscribe to context changes, but only update if collection actually changed
      checkCollection()
    }, [ctx.state.collection])
    
    return collectionRef.current
}