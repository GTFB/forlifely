'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { Loader2, Plus, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EsnadSupportChat } from '@/shared/types/esnad-support'

export default function SupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = React.useState<EsnadSupportChat[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    subject: '',
    message: '',
  })

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/esnad/v1/c/support?orderBy=updatedAt&orderDirection=desc', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to load tickets')
        }

        const data = await response.json() as { docs?: EsnadSupportChat[] }
        setTickets(data.docs || [])
      } catch (err) {
        console.error('Tickets fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject) {
      setError('Заполните тему обращения')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/esnad/v1/c/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          subject: formData.subject,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string; message?: string }
        throw new Error(data.message || data.error || 'Failed to create ticket')
      }

      const data = await response.json() as { success?: boolean; data?: EsnadSupportChat }
      
      // Reset form
      setFormData({ subject: '', message: '' })
      setDialogOpen(false)
      
      // Reload tickets
      const ticketsRes = await fetch('/api/esnad/v1/c/support', {
        credentials: 'include',
      })
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json() as { docs?: EsnadSupportChat[] }
        setTickets(ticketsData.docs || [])
      }

      // Navigate to ticket detail if maid provided
      if (data.data?.maid) {
        router.push(`/c/support/${data.data.maid}`)
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

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

  const getStatusLabel = (statusName: string | null | undefined) => {
    switch (statusName) {
      case 'OPEN':
        return 'Открыт'
      case 'CLOSED':
        return 'Закрыт'
      default:
        return statusName || 'Неизвестно'
    }
  }

  const getStatusVariant = (statusName: string | null | undefined) => {
    switch (statusName) {
      case 'OPEN':
        return 'default'
      case 'CLOSED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Поддержка</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Создать новое обращение
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новое обращение</DialogTitle>
                <DialogDescription>
                  Опишите вашу проблему или вопрос
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Тема *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Краткое описание проблемы"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Подробное описание вашего вопроса или проблемы"
                    rows={6}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      'Отправить'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Мои обращения</CardTitle>
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
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  У вас пока нет обращений в поддержку
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Тема</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Последнее обновление</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.maid}
                      className="cursor-pointer"
                      onClick={() => router.push(`/c/support/${ticket.maid}`)}>
                      <TableCell className="font-medium">{ticket.maid}</TableCell>
                      <TableCell>{ticket.title || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(ticket.statusName)}>
                          {getStatusLabel(ticket.statusName)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ticket.createdAt?.toString() || '')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ticket.updatedAt?.toString() || '')}
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

