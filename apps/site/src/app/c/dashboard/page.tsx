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
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/c/dashboard', {
        //   credentials: 'include',
        // })

        // Mock data
        setTimeout(() => {
          // Calculate next payment date (5 days from now)
          const nextPaymentDate = new Date()
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 5)

          const mockRecentDeals = [
            {
              id: 'DEAL-001',
              uuid: 'uuid-deal-001',
              title: 'Смартфон Samsung Galaxy S24',
              status: 'Активна',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              dataIn: { totalAmount: 150000 },
            },
            {
              id: 'DEAL-002',
              uuid: 'uuid-deal-002',
              title: 'Ноутбук ASUS VivoBook 15',
              status: 'Активна',
              createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              dataIn: { totalAmount: 85000 },
            },
            {
              id: 'DEAL-003',
              uuid: 'uuid-deal-003',
              title: 'Телевизор LG OLED 55"',
              status: 'Активна',
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              dataIn: { totalAmount: 200000 },
            },
            {
              id: 'DEAL-005',
              uuid: 'uuid-deal-005',
              title: 'Стиральная машина Indesit IWSC 5105',
              status: 'Активна',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              dataIn: { totalAmount: 95000 },
            },
          ]

          setStats({
            nextPayment: {
              amount: 12500,
              date: nextPaymentDate.toISOString(),
            },
            totalDebt: 530000,
            activeDealsCount: 4,
            recentDeals: mockRecentDeals,
          })
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
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
