"use client"

import * as React from "react"
import { useAdminSocketEvent } from "./AdminSocketProvider"

type AdminNotices = Record<string, number>

type AdminNoticesContextValue = {
  notices: AdminNotices
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getNotice: (key: string) => number | undefined
}

const AdminNoticesContext = React.createContext<AdminNoticesContextValue>({
  notices: {},
  loading: false,
  error: null,
  refresh: async () => {},
  getNotice: () => undefined,
})

export function AdminNoticesProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = React.useState<AdminNotices>({})
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const fetchNotices = React.useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const response = await fetch("/api/altrp/v1/admin/notices", {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to load admin notices")
      }

      const data = (await response.json()) as AdminNotices
      setNotices(data || {})
      setError(null)
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        return
      }
      console.error("Failed to fetch admin notices", err)
      setError(err instanceof Error ? err.message : "Failed to load admin notices")
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotices()
    return () => abortRef.current?.abort()
  }, [fetchNotices])

  useAdminSocketEvent(
    "admin-updated-notices",
    () => {
      fetchNotices()
    },
    [fetchNotices]
  )

  const getNotice = React.useCallback((key: string) => notices[key], [notices])

  const value = React.useMemo<AdminNoticesContextValue>(
    () => ({
      notices,
      loading,
      error,
      refresh: fetchNotices,
      getNotice,
    }),
    [error, fetchNotices, getNotice, loading, notices]
  )

  return <AdminNoticesContext.Provider value={value}>{children}</AdminNoticesContext.Provider>
}

export function useAdminNotices() {
  return React.useContext(AdminNoticesContext)
}

export function useNotice(key: string) {
  const { getNotice } = useAdminNotices()
  return getNotice(key)
}
