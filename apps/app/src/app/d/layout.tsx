"use client"

import * as React from "react"
import { DeveloperSidebar } from "@/components/developer/DeveloperSidebar"
import { DeveloperHeader } from "@/components/developer/DeveloperHeader"
import { AdminStateProvider } from "@/components/admin/AdminStateProvider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminStateProvider>
        <SidebarProvider>
          <DeveloperSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <DeveloperHeader />
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AdminStateProvider>
    </div>
  )
}
