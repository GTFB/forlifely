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
import { Skeleton } from '@/components/ui/skeleton'

type RawHuman = {
  uuid: string
  haid: string
  fullName: string
  type?: string | null
  createdAt?: string
  dataIn?: any
}

type GuardianRow = {
  uuid: string
  haid: string
  fullName: string
  phone?: string
  relationship?: string
  income?: string
  createdAt?: string
}

export default function AdminGuardiansPage() {
  const [guardians, setGuardians] = React.useState<GuardianRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/esnad/v1/admin/guardians?limit=500', { credentials: 'include' })
        if (!res.ok) throw new Error('Не удалось загрузить поручителей')
        const json = (await res.json()) as { docs?: RawHuman[]; success?: boolean }
        
        if (!json.success || !json.docs) {
          throw new Error('Неверный формат ответа от сервера')
        }

        const mapped: GuardianRow[] = json.docs.map((h) => {
          const dataIn = normalizeDataIn(h.dataIn)
          return {
            uuid: h.uuid,
            haid: h.haid,
            fullName: h.fullName,
            phone: dataIn?.phone,
            relationship: dataIn?.relationship || dataIn?.guarantorRelationship,
            income: dataIn?.income || dataIn?.guarantorIncome,
            createdAt: h.createdAt,
          }
        })

        // Data is already sorted by createdAt DESC from the API
        setGuardians(mapped)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const renderDate = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('ru-RU')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Поручители</h1>
          <p className="text-muted-foreground">Список поручителей, отсортированный по дате добавления</p>
        </div>
        <Badge variant="outline">Всего: {guardians.length}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поручители</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">Поручители не найдены</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Доход</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians.map((g) => (
                  <TableRow key={g.uuid}>
                    <TableCell className="font-medium">{g.fullName || '—'}</TableCell>
                    <TableCell>{g.phone || '—'}</TableCell>
                    <TableCell>{g.income || '—'}</TableCell>
                    <TableCell>{renderDate(g.createdAt)}</TableCell>
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

function normalizeDataIn(raw: any): Record<string, any> | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof raw === 'object') return raw as Record<string, any>
  return null
}

