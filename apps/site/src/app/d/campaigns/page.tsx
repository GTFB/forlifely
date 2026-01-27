"use client"

import * as React from "react"
import { AdminStateProvider, useAdminState } from "@/components/admin/AdminStateProvider"
import { DataTable } from "@/components/application-blocks/data-table/DataTable"
import { useMe } from "@/providers/MeProvider"

function CampaignsContent() {
  const { state, setState } = useAdminState()
  const { user } = useMe()

  // Set collection to goals and add filter for developer's campaigns
  React.useEffect(() => {
    if (user?.humanAid) {
      setState((prev) => ({
        ...prev,
        collection: "goals",
        filters: [
          {
            field: "data_in.owner",
            op: "eq",
            value: user.humanAid,
          },
        ],
      }))
    }
  }, [user?.humanAid, setState])

  return <DataTable />
}

export default function CampaignsPage() {
  return (
    <AdminStateProvider>
      <CampaignsContent />
    </AdminStateProvider>
  )
}
