'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Deal {
  id: string
  uuid: string
  title: string
  status: string
  createdAt: string
  dataIn?: any
}

interface RecentDealsProps {
  deals: Deal[]
}

export function RecentDeals({ deals }: RecentDealsProps) {
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
    if (status === 'Активна') return 'default'
    if (status === 'Закрыта') return 'secondary'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние сделки</CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет сделок</p>
        ) : (
          <Table>
            <TableCaption>Список последних сделок</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID сделки</TableHead>
                <TableHead>Название товара</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/c/deals/${deal.id}`}
                      className="hover:underline text-primary">
                      {deal.id}
                    </Link>
                  </TableCell>
                  <TableCell>{deal.title}</TableCell>
                  <TableCell>
                    {deal.dataIn?.totalAmount
                      ? formatCurrency(deal.dataIn.totalAmount)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(deal.status)}>
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(deal.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}


