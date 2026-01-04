"use client"

import { ReactNode } from "react"
import AdminAuthGuard from "@/components/admin/AdminAuthGuard"
import { AdminStateProvider } from "@/components/admin/AdminStateProvider"
import { AdminSocketProvider } from "@/components/admin/AdminSocketProvider"
import { AdminNoticesProvider } from "@/components/admin/AdminNoticesProvider"
import { NotificationsProvider } from "@/components/admin/NotificationsContext"
import { NotificationsDrawer } from "@/components/admin/NotificationsDrawer"
import { AskForNotificationPush } from "@/components/AskForNotificationPush"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminStateProvider>
        <AdminSocketProvider>
          <AdminNoticesProvider>
            <NotificationsProvider>
              <AdminAuthGuard>
                <AskForNotificationPush />
                <main>{children}</main>
                <NotificationsDrawer />
              </AdminAuthGuard>
            </NotificationsProvider>
          </AdminNoticesProvider>
        </AdminSocketProvider>
      </AdminStateProvider>
    </div>
  )
}
