'use client'

import * as React from 'react'
import { DashboardStats } from '@/components/cabinet/dashboard/DashboardStats'
import { RecentDeals } from '@/components/cabinet/dashboard/RecentDeals'

export default function ConsumerDashboardPage() {
  const [stats, setStats] = React.useState({
    nextPayment: null as { amount: number; date: string } | null,
    totalDebt: 0,
    activeDealsCount: 0,
    recentDeals: [] as any[],
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/c/dashboard', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const data = await response.json()
        setStats({
          nextPayment: data.nextPayment,
          totalDebt: data.totalDebt || 0,
          activeDealsCount: data.activeDealsCount || 0,
          recentDeals: data.recentDeals || [],
        })
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <DashboardStats
                nextPayment={stats.nextPayment}
                totalDebt={stats.totalDebt}
                activeDealsCount={stats.activeDealsCount}
              />
              <RecentDeals deals={stats.recentDeals} />
            </>
          )}
    </div>
  )
}
