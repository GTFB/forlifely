'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'investment' | 'return'
  amount: number
  comment?: string
  date: string
  status: string
}

export default function InvestorWalletPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [depositDialogOpen, setDepositDialogOpen] = React.useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [depositForm, setDepositForm] = React.useState({ amount: '', comment: '' })
  const [withdrawForm, setWithdrawForm] = React.useState({ amount: '', comment: '' })

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/i/wallet/transactions', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setTransactions([
            {
              id: 'TXN-001',
              type: 'deposit',
              amount: 500000,
              comment: 'Пополнение с банковской карты',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-002',
              type: 'investment',
              amount: 200000,
              comment: 'Инвестиция в консервативный портфель',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-003',
              type: 'return',
              amount: 15000,
              comment: 'Возврат по инвестиции',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-004',
              type: 'investment',
              amount: 150000,
              comment: 'Инвестиция в сбалансированный портфель',
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-005',
              type: 'withdrawal',
              amount: 50000,
              comment: 'Вывод на банковскую карту',
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-006',
              type: 'deposit',
              amount: 300000,
              comment: 'Пополнение с банковской карты',
              date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-007',
              type: 'investment',
              amount: 100000,
              comment: 'Инвестиция в агрессивный портфель',
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-008',
              type: 'return',
              amount: 8500,
              comment: 'Возврат по инвестиции',
              date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
            {
              id: 'TXN-009',
              type: 'withdrawal',
              amount: 25000,
              comment: 'Вывод на банковскую карту',
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
            },
            {
              id: 'TXN-010',
              type: 'deposit',
              amount: 200000,
              comment: 'Пополнение с банковской карты',
              date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'completed',
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Transactions fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      // TODO: Implement deposit API
      setDepositDialogOpen(false)
      setDepositForm({ amount: '', comment: '' })
    } catch (err) {
      console.error('Deposit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to deposit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      // TODO: Implement withdrawal API
      setWithdrawDialogOpen(false)
      setWithdrawForm({ amount: '', comment: '' })
    } catch (err) {
      console.error('Withdrawal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to withdraw')
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

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Пополнение'
      case 'withdrawal':
        return 'Вывод'
      case 'investment':
        return 'Инвестиция'
      case 'return':
        return 'Возврат'
      default:
        return type
    }
  }

  const getTransactionTypeVariant = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'return':
        return 'default'
      case 'withdrawal':
        return 'secondary'
      case 'investment':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Мой кошелек</h1>
        <div className="flex gap-2">
          <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Пополнить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Пополнить кошелек</DialogTitle>
                <DialogDescription>
                  Введите сумму для пополнения
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Сумма *</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositForm.amount}
                    onChange={(e) =>
                      setDepositForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="0"
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositComment">Комментарий</Label>
                  <Textarea
                    id="depositComment"
                    value={depositForm.comment}
                    onChange={(e) =>
                      setDepositForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDepositDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      'Пополнить'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Вывести
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Вывести средства</DialogTitle>
                <DialogDescription>
                  Введите сумму для вывода
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Сумма *</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    value={withdrawForm.amount}
                    onChange={(e) =>
                      setWithdrawForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="0"
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawComment">Комментарий</Label>
                  <Textarea
                    id="withdrawComment"
                    value={withdrawForm.comment}
                    onChange={(e) =>
                      setWithdrawForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWithdrawDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      'Вывести'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История транзакций</CardTitle>
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
          ) : transactions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Нет транзакций
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.id}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionTypeVariant(tx.type)}>
                        {getTransactionTypeLabel(tx.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.comment || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === 'completed'
                            ? 'default'
                            : tx.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }>
                        {tx.status === 'completed'
                          ? 'Завершено'
                          : tx.status === 'pending'
                            ? 'В обработке'
                            : 'Отклонено'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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

