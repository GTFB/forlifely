"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/application-blocks/data-table"
import { AdminHeader } from "@/components/admin/AdminHeader"

function AdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect to dashboard if no collection parameter
  React.useEffect(() => {
    const collection = searchParams.get("c")
    if (!collection) {
      router.replace("/admin/dashboard")
    }
  }, [searchParams, router])

  // Don't render if redirecting to dashboard
  const collection = searchParams.get("c")
  if (!collection) {
    return null
  }

  return (
    <>
      <AdminHeader />
      <main className="flex-1 overflow-y-auto p-4">
        <DataTable/>
      </main>
    </>
  )
}

export default function AdminPage() {
  return <AdminContent />
}
