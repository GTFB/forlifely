"use client"

import { ReactNode } from "react"
import * as React from "react"
import AdminAuthGuard from "@/components/admin/AdminAuthGuard"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AdminStateProvider } from "@/components/admin/AdminStateProvider"

// Global state to preserve sidebar open state across remounts
let globalSidebarOpen: boolean | null = null

function getSidebarStateFromStorage(): boolean {
  if (typeof window === 'undefined') return true
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  const savedState = cookies['sidebar_state']
  if (savedState === 'true') return true
  if (savedState === 'false') return false
  return true // default
}

// Stable wrapper component that preserves identity across renders
const SidebarWrapper = React.memo(({ children }: { children: ReactNode }) => {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar?: string
  } | null>(null)

  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: unknown) => {
        const response = data as { user?: { name?: string; email: string; avatar?: string } }
        if (response.user) {
          setUser({
            name: response.user.name || response.user.email,
            email: response.user.email,
            avatar: response.user.avatar,
          })
        }
      })
      .catch(console.error)
  }, [])

  // Initialize from storage on mount
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    if (globalSidebarOpen !== null) {
      return globalSidebarOpen
    }
    const state = getSidebarStateFromStorage()
    globalSidebarOpen = state
    return state
  })

  const handleSidebarOpenChange = React.useCallback((open: boolean) => {
    globalSidebarOpen = open
    setSidebarOpen(open)
  }, [])
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider 
        open={sidebarOpen} 
        onOpenChange={handleSidebarOpenChange}
      >
        <AdminSidebar user={user || undefined} />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if children actually changed (different page)
  return false // Always re-render - let React handle optimization
})

SidebarWrapper.displayName = 'SidebarWrapper'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminStateProvider>
        <SidebarWrapper>
          <AdminAuthGuard>
            {children}
          </AdminAuthGuard>
        </SidebarWrapper>
      </AdminStateProvider>
    </div>
  )
}

