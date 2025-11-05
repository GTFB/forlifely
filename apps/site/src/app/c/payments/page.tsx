'use client'

import * as React from 'react'
import { ConsumerHeader } from '@/components/cabinet/ConsumerHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info } from 'lucide-react'

interface Payment {
  id: string
  dealId: string
  dealTitle: string
  amount: number
  date: string
  status: string
  comment?: string
}

interface Deal {
  id: string
  title: string
  status: string
}

export default function PaymentsPage() {
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    dealId: '',
    amount: '',
    comment: '',
  })

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dealsRes, paymentsRes] = await Promise.all([
          fetch('/api/c/deals?status=Активна&limit=100', {
            credentials: 'include',
          }),
          fetch('/api/c/payments', {
            credentials: 'include',
          }),
        ])

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json() as { deals?: Deal[] }
          setDeals(dealsData.deals || [])
        }

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json() as { payments?: Payment[] }
          setPayments(paymentsData.payments || [])
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.dealId || !formData.amount) {
      setError('Заполните все обязательные поля')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/c/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dealId: formData.dealId,
          amount: parseFloat(formData.amount),
          comment: formData.comment,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || 'Failed to create payment')
      }

      // Reset form
      setFormData({ dealId: '', amount: '', comment: '' })
      
      // Reload payments
      const paymentsRes = await fetch('/api/c/payments', {
        credentials: 'include',
      })
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json() as { payments?: Payment[] }
        setPayments(paymentsData.payments || [])
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment')
    } finally {
      setSubmitting(false)
    }
  }

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
    if (status === 'Оплачен' || status === 'Успешно') return 'default'
    if (status === 'Ожидается') return 'secondary'
    if (status === 'Ошибка') return 'destructive'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Платежи</h1>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Внесение платежа</AlertTitle>
            <AlertDescription>
              Выберите рассрочку и сумму для внесения платежа
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Внести платеж</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dealId">Рассрочка *</Label>
                  <Select
                    value={formData.dealId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, dealId: value }))
                    }>
                    <SelectTrigger id="dealId">
                      <SelectValue placeholder="Выберите рассрочку" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title || deal.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Комментарий</Label>
                  <Textarea
                    id="comment"
                    placeholder="Необязательный комментарий"
                    value={formData.comment}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    'Перейти к оплате'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История платежей</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Нет платежей
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Рассрочка</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Комментарий</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{payment.dealTitle || payment.dealId}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.comment || '—'}
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

