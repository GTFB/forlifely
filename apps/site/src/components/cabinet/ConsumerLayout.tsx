'use client'

import * as React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ConsumerSidebar } from './ConsumerSidebar'
import { ConsumerHeader } from './ConsumerHeader'

interface ConsumerLayoutProps {
  children: React.ReactNode
  headerTitle?: string
  headerBreadcrumbs?: Array<{ label: string; href?: string }>
}

export function ConsumerLayout({
  children,
  headerTitle,
  headerBreadcrumbs,
}: ConsumerLayoutProps) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar?: string
  } | null>(null)

  React.useEffect(() => {
    // Fetch user data
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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider defaultOpen={true}>
        <ConsumerSidebar user={user || undefined} />
        <SidebarInset className="flex flex-col overflow-hidden">
          <ConsumerHeader title={headerTitle} breadcrumbItems={headerBreadcrumbs} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
