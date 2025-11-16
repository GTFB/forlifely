'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import qs from 'qs'
import type { 
  TaxonomyOption, 
  TaxonomyResponse,
  LoanApplication,
  
 } from '@/shared/types/esnad'
 import type { 
    DbPaginatedResult,
    DbPaginationResult,
  } from '@/shared/types/shared'
 

const INITIAL_LIMIT = 10

export default function AdminDealsPage() {
  const router = useRouter()
  const [deals, setDeals] = React.useState<LoanApplication[]>([])
  const [pagination, setPagination] = React.useState<DbPaginationResult>({
    total: 0,
    page: 1,
    limit: INITIAL_LIMIT,
    totalPages: 1,
    
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [managerFilter, setManagerFilter] = React.useState<string>('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [statusOptions, setStatusOptions] = React.useState<TaxonomyOption[]>([])

  React.useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pagination.limit.toString(),
        })

        const filtersPayload = statusFilter !== 'all'
          ? {
              conditions: [
                {
                  field: 'statusName',
                  operator: 'eq',
                  values: [statusFilter],
                },
              ],
            }
          : undefined

        if (filtersPayload) {
          params.append('filters', JSON.stringify(filtersPayload))
        }

        const response = await fetch(`/api/admin/loan-application?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Не удалось загрузить заявки')
        }

        const data = (await response.json()) as DbPaginatedResult<LoanApplication>
        setDeals(
          data.docs
        )
        setPagination(data.pagination)
        setError(null)
        setLoading(false)
      } catch (err) {
        console.error('Deals fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deals')
        setLoading(false)
      }
    }

    fetchDeals()
  }, [currentPage, statusFilter, pagination.limit])

  React.useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const filtersPayload = {
          conditions: [
            {
              field: 'entity',
              operator: 'eq',
              values: ['deal.statusName'],
            },
          ],
        }

        const ordersPayload = {
          orders: [{ field: 'sortOrder', direction: 'asc' }],
        }

        const queryParams = qs.stringify({
          limit: 100,
          filters: JSON.stringify(filtersPayload),
          orders: JSON.stringify(ordersPayload),
        }, {
          encode: true,
          arrayFormat: 'brackets',
        })

        const response = await fetch(`/api/admin/taxonomies?${queryParams}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = (await response.json()) as TaxonomyResponse
        setStatusOptions(data.docs ?? [])
      } catch (err) {
        console.error('Failed to load status taxonomies', err)
      }
    }

    fetchStatuses()
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
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getStatusVariant = (status?: string | null) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'default'
      case 'NEW':
      case 'SCORING':
        return 'secondary'
      case 'REJECTED':
      case 'OVERDUE':
        return 'destructive'
      case 'COMPLETED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status?: string | null) => {
    if (status) {
      const option = statusOptions.find((opt) => opt.name === status)
      if (option) {
        return option.title ?? option.name
      }
    }

    switch (status) {
      case 'NEW':
        return 'Новая заявка'
      case 'SCORING':
        return 'Скоринг'
      case 'INFO_REQUESTED':
        return 'Запрошены данные'
      case 'APPROVED':
        return 'Одобрена'
      case 'REJECTED':
        return 'Отклонена'
      case 'ACTIVE':
        return 'Активна'
      case 'COMPLETED':
        return 'Завершена'
      case 'OVERDUE':
        return 'Просрочена'
      default:
        return status ?? 'Неизвестно'
    }
  }

  const normalizeManager = (name: string | null | undefined) => (name?.trim() ? name.trim() : 'Не назначен')


  const uniqueStatuses = statusOptions
    .filter((option) => option.name)
    .map((option) => ({
      value: option.name,
      label: option.title ?? option.name,
    }))

  const uniqueManagers = Array.from(
    new Set(
      deals.map(() => normalizeManager("")),
    ),
  )
  const breadcrumbs = React.useMemo(
    () => [
      { label: 'Панель администратора', href: '/admin/dashboard' },
      { label: 'Управление заявками', href: '/admin/deals' },
    ],
    [],
  )

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }
  if (loading) {
    return (
      <>
        <AdminHeader title="Управление заявками" breadcrumbItems={breadcrumbs} />
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
        <AdminHeader title="Управление заявками" breadcrumbItems={breadcrumbs} />
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
      <AdminHeader title="Управление заявками" breadcrumbItems={breadcrumbs} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Управление заявками</h1>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ФИО или ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Менеджер" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все менеджеры</SelectItem>
              {uniqueManagers.map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Заявки</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Нет заявок
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">ID</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow
                      key={deal.daid} 
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/deals/view?uuid=${deal.uuid}`)}>
                      <TableCell className="font-medium"><Link href={`/admin/deals/view?uuid=${deal.uuid}`}>{deal.daid}</Link></TableCell>
                      <TableCell>{`${deal.dataIn.firstName} ${deal.dataIn.lastName}`.trim()}</TableCell>
                      <TableCell>{formatCurrency(Number(deal.dataIn.productPrice))}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(deal.statusName)}>
                          {getStatusLabel(deal.statusName)}
                        </Badge>
                      </TableCell>
                      <TableCell>{normalizeManager('')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Показано {deals.length} из {pagination.total} заявок
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1}>
                  Предыдущая
                </Button>
                <span>
                  Страница {pagination.page} из {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= pagination.totalPages}>
                  Следующая
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </>
  )
}

