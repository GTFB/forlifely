'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, User, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import qs from 'qs'
import {
  DbFilters,
  DbPaginatedResult,
} from '@/shared/types/shared'
import {
  LoanApplication
} from '@/shared/types/esnad'


export default function DealDetailPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealUuid = searchParams.get('uuid') ?? ''

  const [deal, setDeal] = React.useState<LoanApplication | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    comment: '',
    manager: '',
    requestMessage: '',
  })
  const breadcrumbs = React.useMemo(() => {
    const base = [
      { label: 'Панель администратора', href: '/admin/dashboard' },
      { label: 'Управление заявками', href: '/admin/deals' },
    ]
    if (deal) {
      return [
        ...base,
        {
          label: `${deal.dataIn.firstName} ${deal.dataIn.lastName} - ${deal.id}`,
        },
      ]
    }
    return [...base, { label: 'Цифровое досье' }]
  }, [deal])

  React.useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true)

        const filters: DbFilters = {
          conditions: [
            {
              field: 'uuid',
              operator: 'eq',
              values: [dealUuid],
            },
          ]
        }
        const query = qs.stringify({
          filters
        })

        const response = await fetch(`/api/admin/loan-application?${query}`, {
          credentials: 'include',
          method: 'GET',
        })
        const data = await response.json() as DbPaginatedResult<LoanApplication>
        setTimeout(() => {
          setDeal(
            data.docs[0]
          )
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Deal fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deal')
        setLoading(false)
      }
    }

    if (dealUuid) {
      fetchDeal()
    }
  }, [dealUuid])

  const submitLoanDecision = async (endpoint: string) => {
    if (!deal) {
      setActionError('Заявка не найдена')
      return
    }

    if (!formData.comment.trim()) {
      setActionError('Комментарий обязателен')
      return
    }

    if (!formData.manager.trim()) {
      setActionError('Необходимо выбрать ответственного сотрудника')
      return
    }

    try {
      setSubmitting(true)
      setActionError(null)

      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          uuid: deal.uuid,
          securityServiceComment: formData.comment.trim(),
          responsibleEmployeeUuid: formData.manager,
        }),
      })

      type LoanDecisionResponse = {
        success?: boolean
        message?: string
      }

      const payload = (await response.json().catch(() => null)) as LoanDecisionResponse | null

      if (!response.ok || (payload && payload.success === false)) {
        const message = payload?.message ?? 'Не удалось выполнить действие'
        throw new Error(message)
      }

      router.push('/admin/deals')
    } catch (err) {
      console.error('Loan decision error:', err)
      setActionError(err instanceof Error ? err.message : 'Не удалось выполнить действие')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async () => {
    await submitLoanDecision('/api/esnad/v1/admin/loans/approve')
  }

  const handleReject = async () => {
    await submitLoanDecision('/api/esnad/v1/admin/loans/cancel')
  }

  const handleRequestInfo = async () => {
    if (!deal) {
      setActionError('Заявка не найдена')
      return
    }

    if (!formData.requestMessage.trim()) {
      setActionError('Необходимо указать текст запроса')
      return
    }

    try {
      setSubmitting(true)
      setActionError(null)

      const response = await fetch('/api/esnad/v1/admin/loans/request-additional-info', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          uuid: deal.uuid,
          comment: formData.requestMessage.trim(),
        }),
      })

      type RequestInfoResponse = {
        success?: boolean
        message?: string
      }

      const payload = (await response.json().catch(() => null)) as RequestInfoResponse | null

      if (!response.ok || (payload && payload.success === false)) {
        const message = payload?.message ?? 'Не удалось отправить запрос дополнительной информации'
        throw new Error(message)
      }

      setRequestDialogOpen(false)
      setFormData((prev) => ({ ...prev, requestMessage: '' }))
      router.push('/admin/deals')
    } catch (err) {
      console.error('Request info error:', err)
      setActionError(
        err instanceof Error ? err.message : 'Не удалось отправить запрос дополнительной информации',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if(! amount) return 'Не указано'
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
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Цифровое досье" breadcrumbItems={breadcrumbs} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    )
  }

  if (error || !deal) {
    return (
      <>
        <AdminHeader title="Цифровое досье" breadcrumbItems={breadcrumbs} />
        <main className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error || 'Заявка не найдена'}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        title={`${deal.dataIn.firstName} ${deal.dataIn.lastName} - ${deal.id}`}
        breadcrumbItems={breadcrumbs}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold">
            {deal.dataIn.firstName} {deal.dataIn.lastName} - {deal.id}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Колонка 1: Данные */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Клиент
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage  alt={deal.dataIn.firstName} /> {/* TODO: Add client avatar */}
                      <AvatarFallback>
                        {deal.dataIn.firstName[0]} {deal.dataIn.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{deal.dataIn.firstName} {deal.dataIn.lastName}</p>
                      <p className="text-sm text-muted-foreground">{deal.dataIn.phone}</p>
                      <p className="text-sm text-muted-foreground">{deal.dataIn.email}</p>
                    </div>
                  </div>
                  <Link href={`/admin/users?search=${deal.dataIn.email}`}>
                    <Button variant="outline" className="w-full">
                      Посмотреть профиль
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Детали рассрочки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Товар</TableCell>
                        <TableCell>{`не указано`}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Цена</TableCell>
                        <TableCell>{formatCurrency(Number(deal.dataIn.productPrice))}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Срок</TableCell>
                        <TableCell>{deal.dataIn.term.join(' - ')} месяцев</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Колонка 2: Скоринг */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Скоринг</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="financial">
                      <AccordionTrigger>Финансовая информация</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Доход в месяц</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Расходы в месяц</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Место работы</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Стаж работы</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="guarantor1">
                      <AccordionTrigger>Поручитель 1</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">ФИО</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Телефон</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Отношение</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Доход</TableCell>
                              <TableCell>{`не указано`}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="documents">
                      <AccordionTrigger>Документы</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {deal.documents?.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Загружен: {formatDate(doc.uploadedAt)}
                                </p>
                              </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline">
                                Просмотр
                              </a>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Колонка 3: Принятие решения */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Решение Службы Безопасности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comment">Комментарий СБ</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                      placeholder="Введите комментарий..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Назначить ответственного</Label>
                    <Select
                      value={formData.manager}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, manager: value }))}>
                      <SelectTrigger id="manager">
                        <SelectValue placeholder="Выберите менеджера" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ivanov">Иванов И.И.</SelectItem>
                        <SelectItem value="petrova">Петрова М.С.</SelectItem>
                        <SelectItem value="sidorov">Сидоров П.А.</SelectItem>
                        <SelectItem value="kozlova">Козлова А.Д.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    {actionError && (
                      <p className="text-sm text-destructive">
                        {actionError}
                      </p>
                    )}
                    <Button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Одобрить
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleReject}
                      disabled={submitting}
                      variant="destructive">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Отказать
                        </>
                      )}
                    </Button>

                    <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" disabled={submitting}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Запросить доп. информацию
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Запрос дополнительной информации</DialogTitle>
                          <DialogDescription>
                            Укажите, какая информация требуется от клиента
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="requestMessage">Сообщение</Label>
                            <Textarea
                              id="requestMessage"
                              value={formData.requestMessage}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, requestMessage: e.target.value }))
                              }
                              placeholder="Опишите, какая информация требуется..."
                              rows={6}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setRequestDialogOpen(false)}>
                              Отмена
                            </Button>
                            <Button onClick={handleRequestInfo} disabled={submitting}>
                              {submitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Отправка...
                                </>
                              ) : (
                                'Отправить запрос'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

