'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface DealDetail {
  deal: {
    id: string
    uuid: string
    title: string
    status: string
    createdAt: string
    dataIn?: any
    dataOut?: any
    products?: any[]
  }
}

export default function DealDetailPageClient() {
  const params = useParams()
  const dealId = params.id as string
  const [dealData, setDealData] = React.useState<DealDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/c/deals/${dealId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to load deal')
        }

        const data = await response.json() as DealDetail
        setDealData(data)
      } catch (err) {
        console.error('Deal fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deal')
      } finally {
        setLoading(false)
      }
    }

    if (dealId) {
      fetchDeal()
    }
  }, [dealId])

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
    }).format(date)
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'Оплачен':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Ожидается':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'Просрочен':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Prepare chart data from payment schedule
  const chartData = React.useMemo(() => {
    if (!dealData?.deal.dataIn?.paymentSchedule) return []
    
    return dealData.deal.dataIn.paymentSchedule.map((payment: any, index: number) => ({
      month: `Платеж ${index + 1}`,
      amount: payment.amount || 0,
      date: payment.date || '',
    }))
  }, [dealData])

  const chartConfig = {
    amount: {
      label: 'Сумма',
      color: 'hsl(var(--chart-1))',
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !dealData) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 m-6">
        <p className="text-sm text-destructive">{error || 'Deal not found'}</p>
      </div>
    )
  }

  const deal = dealData.deal

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Сделка {deal.id}</h1>
        <Badge variant={deal.status === 'Активна' ? 'default' : 'secondary'}>
          {deal.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Детали сделки</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Товар</TableCell>
                  <TableCell>{deal.title || '—'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Цена</TableCell>
                  <TableCell>
                    {deal.dataIn?.purchasePrice
                      ? formatCurrency(deal.dataIn.purchasePrice)
                      : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Первый взнос</TableCell>
                  <TableCell>
                    {deal.dataIn?.downPayment
                      ? formatCurrency(deal.dataIn.downPayment)
                      : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Срок рассрочки</TableCell>
                  <TableCell>
                    {deal.dataIn?.installmentTerm
                      ? `${deal.dataIn.installmentTerm} мес.`
                      : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ежемесячный платеж</TableCell>
                  <TableCell>
                    {deal.dataIn?.monthlyPayment
                      ? formatCurrency(deal.dataIn.monthlyPayment)
                      : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Дата создания</TableCell>
                  <TableCell>{formatDate(deal.createdAt)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>График платежей</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    fill="var(--color-amount)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>График платежей</CardTitle>
        </CardHeader>
        <CardContent>
          {deal.dataIn?.paymentSchedule && deal.dataIn.paymentSchedule.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deal.dataIn.paymentSchedule.map((payment: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(payment.status || 'Ожидается')}
                        <span>{payment.status || 'Ожидается'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">График платежей не доступен</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

