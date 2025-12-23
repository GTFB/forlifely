'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Transaction {
  uuid: string
  wcaid: string
  fullWaid: string | null
  targetAid: string | null
  statusName: string
  amount: number
  type: string
  description: string
  order: number
  createdAt: string
  updatedAt: string
}

const INITIAL_LIMIT = 50

export default function AdminTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: INITIAL_LIMIT,
    totalPages: 1,
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [walletIdFilter, setWalletIdFilter] = React.useState('')

  const fetchTransactions = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)
      if (walletIdFilter) params.append('walletId', walletIdFilter)

      const response = await fetch(`/api/esnad/v1/admin/transactions?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ error: 'Failed to load transactions' }))) as {
          error?: string
        }
        throw new Error(errorData.error || 'Failed to load transactions')
      }

      const data = (await response.json()) as {
        success: boolean
        transactions: Transaction[]
        pagination: {
          total: number
          page: number
          limit: number
          totalPages: number
        }
      }

      setTransactions(data.transactions)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Transactions fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, walletIdFilter])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'FAILED':
        return 'destructive'
      case 'CANCELLED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Завершена'
      case 'PENDING':
        return 'Ожидается'
      case 'FAILED':
        return 'Ошибка'
      case 'CANCELLED':
        return 'Отменена'
      default:
        return status
    }
  }

  const breadcrumbs = React.useMemo(
    () => [
      { label: 'Панель администратора', href: '/admin/dashboard' },
      { label: 'Транзакции', href: '/admin/transactions' },
    ],
    [],
  )

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminHeader breadcrumbItems={breadcrumbs} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Транзакции</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Все транзакции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по ID транзакции..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setPagination((prev) => ({ ...prev, page: 1 }))
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Input
                      placeholder="ID кошелька..."
                      value={walletIdFilter}
                      onChange={(e) => {
                        setWalletIdFilter(e.target.value)
                        setPagination((prev) => ({ ...prev, page: 1 }))
                      }}
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select
                      value={statusFilter || 'all'}
                      onValueChange={(value) => {
                        setStatusFilter(value === 'all' ? '' : value)
                        setPagination((prev) => ({ ...prev, page: 1 }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="COMPLETED">Завершена</SelectItem>
                        <SelectItem value="PENDING">Ожидается</SelectItem>
                        <SelectItem value="FAILED">Ошибка</SelectItem>
                        <SelectItem value="CANCELLED">Отменена</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Транзакции не найдены
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Сумма</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Описание</TableHead>
                            <TableHead>Создана</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.uuid}>
                              <TableCell className="font-mono text-sm">
                                {transaction.wcaid}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(transaction.statusName)}>
                                  {getStatusLabel(transaction.statusName)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.description || '—'}
                              </TableCell>
                              <TableCell>
                                {formatDate(transaction.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Показано {transactions.length} из {pagination.total} транзакций
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevPage}
                          disabled={pagination.page === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Предыдущая
                        </Button>
                        <div className="text-sm">
                          Страница {pagination.page} из {pagination.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={pagination.page >= pagination.totalPages || loading}
                        >
                          Следующая
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

