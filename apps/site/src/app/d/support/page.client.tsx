'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { DeveloperHeader } from '@/components/developer/DeveloperHeader'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { altrpSupportChat } from '@/shared/types/altrp-support'
import { cn } from '@/lib/utils'

interface Operator {
  uuid: string
  humanAid: string | null
  fullName: string | null
}

export default function DeveloperSupportPageClient() {
  const router = useRouter()
  const [tickets, setTickets] = React.useState<altrpSupportChat[]>([])
  const [operators, setOperators] = React.useState<Operator[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [operatorFilter, setOperatorFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchDataBase = React.useCallback(async () => {
    try {
      setError(null)
      
      const [operatorsResponse, ticketsResponse] = await Promise.all([
        fetch('/api/altrp/v1/admin/users/managers', {
          credentials: 'include',
        }),
        fetch('/api/altrp/v1/admin/support?orderBy=updatedAt&orderDirection=desc', {
          credentials: 'include',
        }),
      ])
      
      if (!operatorsResponse.ok) {
        throw new Error('Failed to fetch operators')
      }
      
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch support tickets')
      }
      
      const operatorsData = await operatorsResponse.json() as { docs: Array<{
        uuid: string
        humanAid: string | null
        fullName: string | null
      }> }
      
      const ticketsData = await ticketsResponse.json() as { docs: altrpSupportChat[]; pagination: any }
      
      setOperators(operatorsData.docs.map(op => ({
        uuid: op.uuid,
        humanAid: op.humanAid,
        fullName: op.fullName,
      })))
      setTickets(ticketsData.docs)
    } catch (err) {
      console.error('Data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }, [])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    await fetchDataBase()
    setLoading(false)
  }, [fetchDataBase])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredTickets = React.useMemo(() => {
    let filtered = tickets

    if (operatorFilter !== 'all') {
      filtered = filtered.filter(ticket => (ticket as any).operatorUuid === operatorFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.statusName === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ticket => {
        const t: any = ticket as any
        const title = t.title ? String(t.title).toLowerCase() : ''
        const description = t.description ? String(t.description).toLowerCase() : ''
        return title.includes(query) || description.includes(query)
      })
    }

    return filtered
  }, [tickets, operatorFilter, statusFilter, searchQuery])

  const getStatusBadgeVariant = (status: string | null | undefined) => {
    switch (status) {
      case 'open':
        return 'default'
      case 'closed':
        return 'secondary'
      case 'pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <>
      <DeveloperHeader title="Поддержка" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Поддержка</h1>
            <p className="text-muted-foreground">Управление тикетами поддержки</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск тикетов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Все операторы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все операторы</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.uuid} value={op.uuid}>
                      {op.fullName || 'Неизвестно'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="open">Открыт</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="closed">Закрыт</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Тикеты не найдены</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Тикеты</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оператор</TableHead>
                    <TableHead>Обновлено</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.maid}
                      className="cursor-pointer"
                      onClick={() => router.push(`/d/support/${ticket.maid}`)}
                    >
                      <TableCell className="font-medium">{ticket.title || 'Без названия'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(ticket.statusName)}>
                          {ticket.statusName === 'open' ? 'Открыт' : ticket.statusName === 'closed' ? 'Закрыт' : ticket.statusName === 'pending' ? 'Ожидает' : ticket.statusName || 'неизвестно'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {operators.find(op => op.uuid === (ticket as any).operatorUuid)?.fullName || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
