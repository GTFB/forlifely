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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { useIsMobile } from '@/packages/hooks/use-mobile'

export default function InvestorDashboardPage() {
  const isMobile = useIsMobile()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [metrics, setMetrics] = React.useState({
    totalCapital: 0,
    periodReturn: 0,
    portfolioData: [] as Array<{ date: string; value: number }>,
    investmentStructure: [] as Array<{ name: string; value: number }>,
    recentOperations: [] as Array<{
      id: string
      type: string
      amount: number
      date: string
    }>,
  })

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/i/dashboard', { credentials: 'include' })
        
        // Mock data for now
        setTimeout(() => {
          const now = new Date()
          const portfolioData = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now)
            date.setMonth(date.getMonth() - (11 - i))
            return {
              date: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
              value: 1200000 + Math.random() * 400000 + i * 25000,
            }
          })

          setMetrics({
            totalCapital: 1500000,
            periodReturn: 12.5,
            portfolioData,
            investmentStructure: [
              { name: 'Консервативный', value: 600000 },
              { name: 'Сбалансированный', value: 500000 },
              { name: 'Агрессивный', value: 400000 },
            ],
            recentOperations: [
              {
                id: 'OP-001',
                type: 'Инвестиция',
                amount: 200000,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'OP-002',
                type: 'Возврат',
                amount: 50000,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'OP-003',
                type: 'Пополнение',
                amount: 300000,
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
      <h1 className="text-3xl font-bold">Портфель</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общий капитал
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(metrics.totalCapital)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Доходность за период
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.periodReturn}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных инвестиций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общая прибыль
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(187500)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Динамика портфеля</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {metrics.portfolioData.length > 0 ? (
              <div className="min-w-0 w-full">
                <ChartContainer
                  config={{
                    portfolio: {
                      label: 'Стоимость',
                      color: 'var(--chart-2)',
                    },
                  } satisfies ChartConfig}
                  className="h-[250px] md:h-[300px] w-full min-w-[300px]">
                  <AreaChart data={metrics.portfolioData}>
                    <defs>
                      <linearGradient id="fillPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-portfolio)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="var(--color-portfolio)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      width={50}
                      className="text-xs"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-portfolio)"
                      fill="url(#fillPortfolio)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                Нет данных
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Средняя доходность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">11.2%</div>
                <p className="text-xs text-muted-foreground mt-1">годовых</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Риск портфеля
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Средний</div>
                <p className="text-xs text-muted-foreground mt-1">балансированный</p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Структура вложений</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {metrics.investmentStructure.length > 0 ? (
                <div className="min-w-0 w-full">
                  <ChartContainer
                    config={{
                      Консервативный: {
                        label: 'Консервативный',
                        color: 'var(--chart-1)',
                      },
                      Сбалансированный: {
                        label: 'Сбалансированный',
                        color: 'var(--chart-2)',
                      },
                      Агрессивный: {
                        label: 'Агрессивный',
                        color: 'var(--chart-3)',
                      },
                    } satisfies ChartConfig}
                    className="h-[200px] md:h-[220px] w-full min-w-[280px]">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                        }
                      />
                      <Pie
                        data={metrics.investmentStructure}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={isMobile ? 60 : 80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {metrics.investmentStructure.map((entry) => {
                          return (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={`var(--color-${entry.name})`}
                            />
                          )
                        })}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-[200px] md:h-[220px] flex items-center justify-center text-muted-foreground">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние операции</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentOperations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Нет операций
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentOperations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.id}</TableCell>
                    <TableCell>{op.type}</TableCell>
                    <TableCell>{formatCurrency(op.amount)}</TableCell>
                    <TableCell>{new Date(op.date).toLocaleDateString('ru-RU')}</TableCell>
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

