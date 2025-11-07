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
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  })
  const [metrics, setMetrics] = React.useState({
    newApplicationsToday: 0,
    newApplicationsPeriod: 0,
    scoringAmount: 0,
    overdueCount: 0,
    investorPortfolio: 0,
    applicationsByManager: [] as Array<{ manager: string; count: number }>,
    recentEvents: [] as Array<{
      id: string
      type: string
      description: string
      date: string
    }>,
  })

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/dashboard', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setMetrics({
            newApplicationsToday: 12,
            newApplicationsPeriod: 145,
            scoringAmount: 25000000,
            overdueCount: 8,
            investorPortfolio: 150000000,
            applicationsByManager: [
              { manager: 'Иванов И.И.', count: 45 },
              { manager: 'Петрова М.С.', count: 38 },
              { manager: 'Сидоров П.А.', count: 32 },
              { manager: 'Козлова А.Д.', count: 30 },
            ],
            recentEvents: [
              {
                id: 'EVT-001',
                type: 'Новая заявка',
                description: 'Заявка #DEAL-001 от Иванов Иван Иванович',
                date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'EVT-002',
                type: 'Одобрение',
                description: 'Заявка #DEAL-002 одобрена менеджером Петрова М.С.',
                date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'EVT-003',
                type: 'Новый инвестор',
                description: 'Зарегистрирован новый инвестор: Сидоров Петр',
                date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'EVT-004',
                type: 'Отказ',
                description: 'Заявка #DEAL-003 отклонена менеджером Иванов И.И.',
                date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'EVT-005',
                type: 'Новая заявка',
                description: 'Заявка #DEAL-004 от Козлова Анна Дмитриевна',
                date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
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
  }, [dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} мин. назад`
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`
    } else {
      return `${diffDays} дн. назад`
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Операционная сводка" />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Операционная сводка" />
        <main className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Операционная сводка" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Операционная сводка</h1>
          <div className="flex gap-2">
            <DateTimePicker
              mode="date"
              value={dateRange.start}
              onChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
              placeholder="Начало периода"
            />
            <DateTimePicker
              mode="date"
              value={dateRange.end}
              onChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
              placeholder="Конец периода"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Новых заявок сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.newApplicationsToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Новых заявок за период
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.newApplicationsPeriod}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Сумма на скоринге
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics.scoringAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Количество просрочек
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общий портфель инвесторов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics.investorPortfolio)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Заявки по менеджерам</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.applicationsByManager.length > 0 ? (
                <ChartContainer
                  config={{
                    applications: {
                      label: 'Заявки',
                      color: 'var(--chart-2)',
                    },
                  } satisfies ChartConfig}
                  className="h-[250px] w-full">
                  <BarChart data={metrics.applicationsByManager}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="manager"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
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
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Последние 5 событий</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentEvents.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Нет событий
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Время</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.type}</TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(event.date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </>
  )
}
