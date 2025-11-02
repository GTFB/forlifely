"use client"

import { ReactNode } from "react"
import * as React from "react"
import AdminAuthGuard from "@/components/admin/AdminAuthGuard"
import { AppSidebar } from "@/components/application-blocks/app-sidebar"
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
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if children actually changed (different page)
  // Children are different React elements for different pages, so we need to compare by key or content
  // But for now, always re-render - the important part is that AppSidebar is stable
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

