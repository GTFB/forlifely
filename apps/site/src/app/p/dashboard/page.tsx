'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

export default function PartnerDashboardPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [metrics, setMetrics] = React.useState({
    applicationsThisMonth: 0,
    approvedApplications: 0,
    totalPayouts: 0,
    applicationsByDay: [] as Array<{ date: string; count: number }>,
    recentApplications: [] as Array<{
      id: string
      clientName: string
      amount: number
      date: string
      status: string
    }>,
  })

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/p/dashboard', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          const now = new Date()
          const applicationsByDay = Array.from({ length: 14 }, (_, i) => {
            const date = new Date(now)
            date.setDate(date.getDate() - (13 - i))
            return {
              date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
              count: Math.floor(Math.random() * 8) + 1,
            }
          })

          setMetrics({
            applicationsThisMonth: 45,
            approvedApplications: 32,
            totalPayouts: 2500000,
            applicationsByDay,
            recentApplications: [
              {
                id: 'APP-001',
                clientName: 'Иванов Иван Иванович',
                amount: 150000,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'Одобрена',
              },
              {
                id: 'APP-002',
                clientName: 'Петрова Мария Сергеевна',
                amount: 85000,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'На рассмотрении',
              },
              {
                id: 'APP-003',
                clientName: 'Сидоров Петр Александрович',
                amount: 200000,
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'Одобрена',
              },
              {
                id: 'APP-004',
                clientName: 'Козлова Анна Дмитриевна',
                amount: 120000,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'Одобрена',
              },
              {
                id: 'APP-005',
                clientName: 'Морозов Дмитрий Викторович',
                amount: 95000,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'Отклонена',
              },
            ],
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Дашборд</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Заявок за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.applicationsThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Одобрено заявок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.approvedApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Сумма выплат
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(metrics.totalPayouts)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заявки по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.applicationsByDay.length > 0 ? (
            <ChartContainer
              config={{
                applications: {
                  label: 'Заявки',
                  color: 'var(--chart-2)',
                },
              } satisfies ChartConfig}
              className="h-[300px] w-full">
              <BarChart data={metrics.applicationsByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${value} заявок`}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-applications)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Нет данных
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние заявки</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentApplications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Нет заявок
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.clientName}</TableCell>
                    <TableCell>{formatCurrency(app.amount)}</TableCell>
                    <TableCell>
                      {new Date(app.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          app.status === 'Одобрена'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : app.status === 'На рассмотрении'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {app.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

