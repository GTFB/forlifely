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
import { AdminSocketProvider } from "@/components/admin/AdminSocketProvider"
import { AdminNoticesProvider } from "@/components/admin/AdminNoticesProvider"
import { BottomNavigation } from "@/components/cabinet/BottomNavigation"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CheckSquare,
} from 'lucide-react'
import type { NavigationItem } from "@/components/cabinet/BottomNavigation"
import { usePathname } from "next/navigation"
import { AskForNotificationPush } from "@/components/AskForNotificationPush"

// Global state to preserve sidebar open state across remounts
let globalSidebarOpen: boolean | null = null
const HIDE_SIDEBAR_ROUTES = new Set([
  "/m/create-new-user",
  "/m/create-new-user/",
])

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

  const pathname = usePathname()
  const shouldHideSidebar = pathname ? HIDE_SIDEBAR_ROUTES.has(pathname) : false

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={handleSidebarOpenChange}
      >
        {!shouldHideSidebar && <AdminSidebar user={user || undefined} />}
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

const adminNavigationItems: NavigationItem[] = [
  {
    title: 'Сводка',
    url: '/m/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Заявки',
    url: '/m/deals',
    icon: FileText,
  },
  // Временно скрыто
  // {
  //   title: 'Блог',
  //   url: '/m/content/blog',
  //   icon: BookOpen,
  // },
  {
    title: 'Задачи',
    url: '/m/tasks',
    icon: CheckSquare,
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <AdminStateProvider>
        <AdminSocketProvider>
          <AdminNoticesProvider>
            <AdminAuthGuard>
              <AskForNotificationPush />
              <SidebarWrapper>
                {children}
              </SidebarWrapper>
              <BottomNavigation navigationItems={adminNavigationItems} />
            </AdminAuthGuard>
          </AdminNoticesProvider>
        </AdminSocketProvider>
      </AdminStateProvider>
    </div>
  )
}

