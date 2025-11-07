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
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useRouter } from 'next/navigation'

interface Ticket {
  id: string
  subject: string
  status: string
  user: string
  operator: string
  createdAt: string
  updatedAt: string
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [operatorFilter, setOperatorFilter] = React.useState<string>('all')

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/support', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setTickets([
            {
              id: 'TICKET-001',
              subject: 'Проблема с оплатой',
              status: 'Открыт',
              user: 'Иванов Иван Иванович',
              operator: 'Петрова М.С.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'TICKET-002',
              subject: 'Вопрос по заявке',
              status: 'В работе',
              user: 'Петрова Мария Сергеевна',
              operator: 'Иванов И.И.',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'TICKET-003',
              subject: 'Техническая проблема',
              status: 'Закрыт',
              user: 'Сидоров Петр Александрович',
              operator: 'Сидоров П.А.',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // Add more mock tickets...
            ...Array.from({ length: 12 }, (_, i) => ({
              id: `TICKET-${String(i + 4).padStart(3, '0')}`,
              subject: `Тикет ${i + 4}`,
              status: ['Открыт', 'В работе', 'Закрыт'][i % 3],
              user: `Пользователь ${i + 4}`,
              operator: ['Петрова М.С.', 'Иванов И.И.', 'Сидоров П.А.', 'Козлова А.Д.'][i % 4],
              createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000).toISOString(),
            })),
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Tickets fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tickets')
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Открыт':
        return 'default'
      case 'В работе':
        return 'secondary'
      case 'Закрыт':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (operatorFilter === 'all') return true
    return ticket.operator === operatorFilter
  })

  const uniqueOperators = Array.from(new Set(tickets.map((ticket) => ticket.operator)))

  if (loading) {
    return (
      <>
        <AdminHeader title="Управление поддержкой" />
        <main className="flex-1 overflow-y-auto">
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
        <AdminHeader title="Управление поддержкой" />
        <main className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Управление поддержкой" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Управление поддержкой</h1>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск..." className="pl-10" />
          </div>
          <Select value={operatorFilter} onValueChange={setOperatorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Оператор" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все операторы</SelectItem>
              {uniqueOperators.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {operator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Тикеты</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Нет тикетов
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Тема</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Ответственный оператор</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Последнее обновление</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{ticket.user}</TableCell>
                      <TableCell>{ticket.operator}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ticket.updatedAt)}
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

