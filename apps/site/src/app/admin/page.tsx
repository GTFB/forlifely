"use client"

import * as React from "react"
import { AppSidebar } from "@/components/application-blocks/app-sidebar"
import { DataTable } from "@/components/application-blocks/data-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AdminStateProvider, useAdminState } from "@/components/admin/AdminStateProvider"
import { AdminHeader } from "@/components/admin/AdminHeader"
import data from "./data.json"

function AdminContent() {
  const { state } = useAdminState()

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4">
            <DataTable/>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminStateProvider>
      <AdminContent />
    </AdminStateProvider>
  )
}
