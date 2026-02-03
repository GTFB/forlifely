"use client"

import * as React from "react"
import { AdminStateProvider, useAdminState } from "@/components/admin/AdminStateProvider"
import { DataTable } from "@/components/application-blocks/data-table/DataTable"

function CampaignsContent() {
  const { setState } = useAdminState()

  // Set collection to goals (all campaigns, no filter)
  React.useEffect(() => {
    setState((prev) => ({
      ...prev,
      collection: "goals",
      filters: [],
    }))
  }, [setState])

  return <DataTable />
}

export default function CampaignsPage() {
  return (
    <AdminStateProvider>
      <CampaignsContent />
    </AdminStateProvider>
  )
}
