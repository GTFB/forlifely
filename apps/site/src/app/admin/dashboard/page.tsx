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
        // TODO: Replace with actual API endpoint for other metrics
        // const response = await fetch('/api/admin/dashboard', { credentials: 'include' })
        
        // Fetch recent journal events
        const journalsResponse = await fetch('/api/esnad/v1/admin/journals?limit=5&orderBy=createdAt&orderDirection=desc', {
          credentials: 'include',
        })
        
        if (!journalsResponse.ok) {
          throw new Error('Failed to fetch journals')
        }
        
        const journalsData = (await journalsResponse.json()) as {
          success: boolean
          data?: {
            docs: Array<{
              uuid?: string
              id: number
              action: string
              details: string | Record<string, unknown>
              createdAt?: string
            }>
          }
        }
        const journals = journalsData.success && journalsData.data ? journalsData.data.docs : []
        
        // Transform journals to events format
        const recentEvents = journals.map((journal) => {
          const rawDetails =
            typeof journal.details === 'string'
              ? (JSON.parse(journal.details) as Record<string, unknown>)
              : (journal.details as Record<string, unknown> | undefined)

          const actionType = journal.action || 'Событие'

          // Map action types to readable names
          const actionNames: Record<string, string> = {
            LOAN_APPLICATION_SNAPSHOT: 'Заявка на рассрочку',
            DEAL_STATUS_CHANGE: 'Изменение статуса',
            DEAL_APPROVED: 'Одобрение',
            DEAL_REJECTED: 'Отказ',
            DEAL_CANCELLED: 'Отмена',
            INVESTOR_REGISTERED: 'Новый инвестор',
            PAYMENT_RECEIVED: 'Получен платеж',
          }

          const type = actionNames[journal.action] || actionType

          let description: string

          // Use description from details if available (enriched by parseJournals)
          if (rawDetails && 'description' in rawDetails && typeof rawDetails.description === 'string') {
            description = rawDetails.description
          } else {
            // Check originalAction from details if available, otherwise use journal.action
            const originalAction = (rawDetails as { originalAction?: string } | undefined)?.originalAction || journal.action
            if (originalAction === 'LOAN_APPLICATION_SNAPSHOT' && rawDetails && 'snapshot' in rawDetails) {
            const snapshot = rawDetails.snapshot as {
              dataIn?: unknown
            }

            let dataIn = snapshot?.dataIn as
              | {
                  firstName?: string
                  lastName?: string
                  productPrice?: string | number
                }
              | undefined

            if (typeof snapshot?.dataIn === 'string') {
              try {
                dataIn = JSON.parse(snapshot.dataIn) as typeof dataIn
              } catch {
                // ignore parse error, fallback below
              }
            }

            const firstName = dataIn?.firstName?.trim() ?? ''
            const lastName = dataIn?.lastName?.trim() ?? ''
            const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'клиента'

            const rawPrice = dataIn?.productPrice
            let amountText = ''
            if (rawPrice !== undefined) {
              const numeric =
                typeof rawPrice === 'number'
                  ? rawPrice
                  : Number(String(rawPrice).replace(/[^\d.-]/g, ''))
              amountText = Number.isFinite(numeric) ? formatCurrency(numeric) : String(rawPrice)
            }

              description = `Заявка на рассрочку от ${fullName}${amountText ? ` на сумму ${amountText}` : ''}`
            } else {
              const details = rawDetails as { message?: string; context?: string } | undefined
              const message = details?.message || details?.context || actionType
              description = message || `${actionType} #${journal.uuid?.substring(0, 8) || journal.id}`
            }
          }
          
          return {
            id: journal.uuid || `journal-${journal.id}`,
            type,
            description,
            date: journal.createdAt || new Date().toISOString(),
          }
        })
        
        // Mock data for other metrics (TODO: replace with actual API)
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
            recentEvents,
          })
          setLoading(false)
        }, 100)
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
        <AdminHeader title="Общая сводка" />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
        <AdminHeader title="Общая сводка" />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Общая сводка" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex-shrink-0">Общая сводка</h1>
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <DateTimePicker
              mode="date"
              value={dateRange.start}
              onChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
              placeholder="Начало периода"
              className="w-[180px]"
            />
            <DateTimePicker
              mode="date"
              value={dateRange.end}
              onChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
              placeholder="Конец периода"
              className="w-[180px]"
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

        <div className="grid gap-4 md:grid-cols-2 min-w-0">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общий портфель инвесторов
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-3xl font-bold break-words overflow-wrap-anywhere">{formatCurrency(metrics.investorPortfolio)}</div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Заявки по менеджерам</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 overflow-x-auto">
              {metrics.applicationsByManager.length > 0 ? (
                <div className="min-w-[300px]">
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
                </div>
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
