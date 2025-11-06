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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Loader2, MoreHorizontal, Eye, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Deal {
  id: string
  uuid: string
  clientName: string
  productName: string
  amount: number
  status: string
  createdAt: string
}

export default function PartnerDealsPage() {
  const router = useRouter()
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/p/deals', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setDeals([
            {
              id: 'APP-001',
              uuid: 'uuid-001',
              clientName: 'Иванов Иван Иванович',
              productName: 'Смартфон Samsung Galaxy S24',
              amount: 150000,
              status: 'Одобрена',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-002',
              uuid: 'uuid-002',
              clientName: 'Петрова Мария Сергеевна',
              productName: 'Ноутбук ASUS VivoBook',
              amount: 85000,
              status: 'На рассмотрении',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-003',
              uuid: 'uuid-003',
              clientName: 'Сидоров Петр Александрович',
              productName: 'Телевизор LG OLED 55"',
              amount: 200000,
              status: 'Одобрена',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-004',
              uuid: 'uuid-004',
              clientName: 'Козлова Анна Дмитриевна',
              productName: 'Холодильник Bosch',
              amount: 120000,
              status: 'Одобрена',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-005',
              uuid: 'uuid-005',
              clientName: 'Морозов Дмитрий Викторович',
              productName: 'Стиральная машина Indesit',
              amount: 95000,
              status: 'Отклонена',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-006',
              uuid: 'uuid-006',
              clientName: 'Волкова Елена Петровна',
              productName: 'Пылесос Dyson V15',
              amount: 65000,
              status: 'Одобрена',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-007',
              uuid: 'uuid-007',
              clientName: 'Новиков Сергей Владимирович',
              productName: 'Игровая консоль PlayStation 5',
              amount: 75000,
              status: 'На рассмотрении',
              createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'APP-008',
              uuid: 'uuid-008',
              clientName: 'Смирнова Ольга Игоревна',
              productName: 'Микроволновка Panasonic',
              amount: 35000,
              status: 'Одобрена',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
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

  const handleView = (dealId: string) => {
    router.push(`/p/deals/${dealId}`)
  }

  const handleDownload = (dealId: string) => {
    // TODO: Implement download contract
    console.log('Download contract for deal:', dealId)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Заявки</h1>

      <Card>
        <CardHeader>
          <CardTitle>Все заявки</CardTitle>
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
          ) : deals.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Нет заявок
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.uuid}>
                    <TableCell className="font-medium">{deal.id}</TableCell>
                    <TableCell>{deal.clientName}</TableCell>
                    <TableCell>{deal.productName}</TableCell>
                    <TableCell>{formatCurrency(deal.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(deal.status)}>
                        {deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(deal.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(deal.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Просмотреть
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(deal.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Скачать договор
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

