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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface Deal {
  id: string
  clientName: string
  amount: number
  status: string
  manager: {
    name: string
    avatar?: string
  }
  createdAt: string
}

export default function AdminDealsPage() {
  const router = useRouter()
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [managerFilter, setManagerFilter] = React.useState<string>('all')

  React.useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/deals', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setDeals([
            {
              id: 'deal-001',
              clientName: 'Иванов Иван Иванович',
              amount: 150000,
              status: 'На рассмотрении',
              manager: {
                name: 'Петрова М.С.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-002',
              clientName: 'Петрова Мария Сергеевна',
              amount: 85000,
              status: 'Одобрена',
              manager: {
                name: 'Иванов И.И.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-003',
              clientName: 'Сидоров Петр Александрович',
              amount: 200000,
              status: 'Отклонена',
              manager: {
                name: 'Сидоров П.А.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-004',
              clientName: 'Козлова Анна Дмитриевна',
              amount: 120000,
              status: 'Одобрена',
              manager: {
                name: 'Козлова А.Д.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-005',
              clientName: 'Морозов Дмитрий Викторович',
              amount: 95000,
              status: 'На рассмотрении',
              manager: {
                name: 'Петрова М.С.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-006',
              clientName: 'Волкова Елена Игоревна',
              amount: 180000,
              status: 'Одобрена',
              manager: {
                name: 'Иванов И.И.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-007',
              clientName: 'Новиков Сергей Петрович',
              amount: 110000,
              status: 'На рассмотрении',
              manager: {
                name: 'Сидоров П.А.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-008',
              clientName: 'Лебедева Ольга Владимировна',
              amount: 165000,
              status: 'Отклонена',
              manager: {
                name: 'Козлова А.Д.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-009',
              clientName: 'Соколов Андрей Николаевич',
              amount: 140000,
              status: 'Одобрена',
              manager: {
                name: 'Петрова М.С.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'deal-010',
              clientName: 'Павлова Татьяна Александровна',
              amount: 130000,
              status: 'На рассмотрении',
              manager: {
                name: 'Иванов И.И.',
                avatar: undefined,
              },
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Deals fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deals')
        setLoading(false)
      }
    }

    fetchDeals()
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Одобрена':
        return 'default'
      case 'На рассмотрении':
        return 'secondary'
      case 'Отклонена':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
    const matchesManager = managerFilter === 'all' || deal.manager.name === managerFilter

    return matchesSearch && matchesStatus && matchesManager
  })

  const uniqueManagers = Array.from(new Set(deals.map((deal) => deal.manager.name)))
  const uniqueStatuses = Array.from(new Set(deals.map((deal) => deal.status)))

  if (loading) {
    return (
      <>
        <AdminHeader title="Управление заявками" />
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
        <AdminHeader title="Управление заявками" />
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
      <AdminHeader title="Управление заявками" />
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
                <SelectItem key={status} value={status}>
                  {status}
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
            {filteredDeals.length === 0 ? (
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
                    <TableHead>Статус</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/deals/${deal.id}`)}>
                      <TableCell className="font-medium">{deal.id}</TableCell>
                      <TableCell>{deal.clientName}</TableCell>
                      <TableCell>{formatCurrency(deal.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(deal.status)}>
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={deal.manager.avatar} alt={deal.manager.name} />
                            <AvatarFallback className="text-xs">
                              {deal.manager.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{deal.manager.name}</span>
                        </div>
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

