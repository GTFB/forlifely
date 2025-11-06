'use client'

import * as React from 'react'
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
import { Loader2 } from 'lucide-react'

interface Payout {
  id: string
  amount: number
  date: string
  status: string
  description?: string
}

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/p/payouts', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setPayouts([
            {
              id: 'PAY-001',
              amount: 450000,
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 01.01-15.01',
            },
            {
              id: 'PAY-002',
              amount: 320000,
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 16.12-31.12',
            },
            {
              id: 'PAY-003',
              amount: 280000,
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 01.12-15.12',
            },
            {
              id: 'PAY-004',
              amount: 195000,
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 16.11-30.11',
            },
            {
              id: 'PAY-005',
              amount: 150000,
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'В обработке',
              description: 'Выплата за одобренные заявки за период 16.01-20.01',
            },
            {
              id: 'PAY-006',
              amount: 125000,
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 01.11-15.11',
            },
            {
              id: 'PAY-007',
              amount: 95000,
              date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Выплачено',
              description: 'Выплата за одобренные заявки за период 16.10-31.10',
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Payouts fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load payouts')
        setLoading(false)
      }
    }

    fetchPayouts()
  }, [])

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Выплачено':
        return 'default'
      case 'В обработке':
        return 'secondary'
      case 'Отменено':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Выплаты</h1>

      <Card>
        <CardHeader>
          <CardTitle>История выплат</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : payouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Нет выплат
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.id}</TableCell>
                    <TableCell>{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>{payout.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payout.status)}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payout.date)}
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

