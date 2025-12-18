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
import { Loader2, FileText, User, CheckCircle, XCircle, MessageSquare, Clock, AlertTriangle, Save } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { EsnadHuman } from '@/shared/types/esnad'
import Link from 'next/link'
import qs from 'qs'
import {
  DbFilters,
  DbPaginatedResult,
} from '@/shared/types/shared'
import {
  LoanApplication,
  LoanApplicationDataIn,
} from '@/shared/types/esnad'


export default function DealDetailPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealUuid = searchParams.get('uuid') ?? ''

  const [deal, setDeal] = React.useState<LoanApplication | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [documentMetadata, setDocumentMetadata] = React.useState<Record<string, { fileName: string }>>({})
  const [humanKycDocuments, setHumanKycDocuments] = React.useState<Array<{ mediaUuid: string; type: string; uploadedAt?: string }>>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [humanClient, setHumanClient] = React.useState<EsnadHuman | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false)
  const [managers, setManagers] = React.useState<Array<{ uuid: string; fullName: string | null; email: string }>>([])
  const [loadingManagers, setLoadingManagers] = React.useState(false)
  const [finances, setFinances] = React.useState<Array<{
    uuid: string
    statusName: string
    paymentDate: string | null
    sum: number
    paidAt: string | null
    paymentNumber: number | null
    order: number
  }>>([])
  const [loadingFinances, setLoadingFinances] = React.useState(false)
  const [formData, setFormData] = React.useState({
    comment: '',
    manager: '',
    requestMessage: '',
  })

  const [priorityData, setPriorityData] = React.useState({
    priority: 'low' as 'low' | 'medium' | 'high',
    priorityReason: '',
  })
  const [prioritySaving, setPrioritySaving] = React.useState(false)
  const [priorityError, setPriorityError] = React.useState<string | null>(null)
  const [prioritySuccess, setPrioritySuccess] = React.useState(false)
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

        const response = await fetch(`/api/esnad/v1/admin/loan-application?${query}`, {
          credentials: 'include',
          method: 'GET',
        })
        const data = await response.json() as DbPaginatedResult<LoanApplication>
        const fetchedDeal = data.docs[0]
        
        setTimeout(() => {
          setDeal(fetchedDeal)
          
          // Initialize priority data from deal
          const dataIn = fetchedDeal.dataIn as LoanApplicationDataIn
          setPriorityData({
            priority: dataIn.priority || 'low',
            priorityReason: dataIn.priorityReason || '',
          })
          
          setLoading(false)
        }, 500)

        // Load document metadata if documents exist
        if (fetchedDeal) {
          const dataInExtended = fetchedDeal.dataIn as LoanApplicationDataIn & { documentPhotos?: string[] }
          const documentUuids = dataInExtended.documentPhotos || []
          
          if (documentUuids.length > 0) {
            try {
              const metadataResponse = await fetch('/api/esnad/v1/admin/files/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ uuids: documentUuids }),
              })
              
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json() as { success: boolean; metadata: Array<{ uuid: string; fileName: string }> }
                if (metadataData.success && metadataData.metadata) {
                  const metadataMap: Record<string, { fileName: string }> = {}
                  metadataData.metadata.forEach((meta) => {
                    metadataMap[meta.uuid] = { fileName: meta.fileName }
                  })
                  setDocumentMetadata(metadataMap)
                }
              }
            } catch (err) {
              console.error('Ошибка при загрузке метаданных документов:', err)
              // Не показываем ошибку пользователю, просто не загружаем метаданные
            }
          }

          // Load human KYC documents if clientAid exists
          if (fetchedDeal.clientAid) {
            try {
              const humanResponse = await fetch(`/api/esnad/v1/admin/human/by-haid/${fetchedDeal.clientAid}`, {
                credentials: 'include',
              })
              
              if (humanResponse.ok) {
                const humanData = await humanResponse.json() as { success: boolean; human?: { dataIn?: any } }
                if (humanData.success && humanData.human?.dataIn) {
                  let dataIn: any = {}
                  try {
                    dataIn = typeof humanData.human.dataIn === 'string' 
                      ? JSON.parse(humanData.human.dataIn) 
                      : humanData.human.dataIn
                  } catch (error) {
                    console.error('Failed to parse human dataIn:', error)
                  }
                  
                  const kycDocuments = dataIn?.kycDocuments || []
                  // Use all KYC documents so we can show selfie, selfie_with_passport, passport_registration, income certificates, etc.
                  setHumanKycDocuments(kycDocuments)
                  setHumanClient(humanData.human as EsnadHuman)

                  // Load metadata for KYC documents
                  if (kycDocuments.length > 0) {
                    const kycUuids = kycDocuments.map((doc: any) => doc.mediaUuid).filter(Boolean)
                    if (kycUuids.length > 0) {
                      try {
                        const kycMetadataResponse = await fetch('/api/esnad/v1/admin/files/metadata', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ uuids: kycUuids }),
                        })
                        
                        if (kycMetadataResponse.ok) {
                          const kycMetadataData = await kycMetadataResponse.json() as { success: boolean; metadata: Array<{ uuid: string; fileName: string }> }
                          if (kycMetadataData.success && kycMetadataData.metadata) {
                            const kycMetadataMap: Record<string, { fileName: string }> = {}
                            kycMetadataData.metadata.forEach((meta) => {
                              kycMetadataMap[meta.uuid] = { fileName: meta.fileName }
                            })
                            setDocumentMetadata((prev) => ({ ...prev, ...kycMetadataMap }))
                          }
                        }
                      } catch (error) {
                        console.error('Failed to load KYC document metadata:', error)
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Failed to load human KYC documents:', error)
            }
          }
        }
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

  // Load managers on component mount
  React.useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true)
        const response = await fetch('/api/esnad/v1/admin/users/managers', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch managers')
        }

        const data = await response.json() as { docs?: Array<{ uuid: string; fullName: string | null; email: string }> }
        if (data.docs) {
          setManagers(data.docs)
        }
      } catch (err) {
        console.error('Ошибка при загрузке менеджеров:', err)
        // Не показываем ошибку пользователю, просто оставляем пустой список
      } finally {
        setLoadingManagers(false)
      }
    }

    fetchManagers()
  }, [])

  // Fetch finances for this deal (after deal is loaded, by external deal ID daid)
  React.useEffect(() => {
    const fetchFinances = async () => {
      const dealId = deal?.daid
      if (!dealId) return

      try {
        setLoadingFinances(true)

        const response = await fetch(`/api/esnad/v1/admin/deals/${dealId}/finances`, {
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({ error: 'Failed to load finances' }))) as { error?: string }
          throw new Error(errorData.error || 'Не удалось загрузить платежи')
        }

        const data = (await response.json()) as {
          success: boolean
          finances: Array<{
            uuid: string
            statusName: string
            paymentDate: string | null
            sum: number
            paidAt: string | null
            paymentNumber: number | null
            order: number
          }>
          total: number
        }
        setFinances(data.finances || [])
      } catch (err) {
        console.error('Finances fetch error:', err)
        // Не показываем ошибку пользователю, просто оставляем пустой список
      } finally {
        setLoadingFinances(false)
      }
    }

    fetchFinances()
  }, [deal])

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
          managerUuid: formData.manager,
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

  const handlePriorityUpdate = async () => {
    if (!deal) return

    try {
      setPrioritySaving(true)
      setPriorityError(null)
      setPrioritySuccess(false)

      const response = await fetch('/api/esnad/v1/admin/loan-application/priority', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: deal.uuid,
          priority: priorityData.priority,
          priorityReason: priorityData.priorityReason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string; message?: string }
        throw new Error(errorData.message || errorData.error || 'Failed to update priority')
      }

      const data = await response.json() as { success?: boolean; deal?: LoanApplication; message?: string }
      if (data.success && data.deal) {
        setDeal(data.deal)
        
        // Update priority form data from response
        const updatedDataIn = data.deal.dataIn as LoanApplicationDataIn
        setPriorityData({
          priority: updatedDataIn.priority || 'low',
          priorityReason: updatedDataIn.priorityReason || '',
        })
        
        setPrioritySuccess(true)
        setTimeout(() => setPrioritySuccess(false), 3000)
      } else {
        throw new Error(data.message || 'Failed to update priority')
      }
    } catch (err) {
      console.error('Failed to update priority:', err)
      setPriorityError(err instanceof Error ? err.message : 'Failed to update priority')
    } finally {
      setPrioritySaving(false)
    }
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

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'Оплачен':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Ожидается':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'Просрочен':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Calculate payment schedule - only if deal is approved or schedule already exists
  // Merge with actual finances data if available
  const paymentSchedule = React.useMemo(() => {
    if (!deal?.dataIn) return []
    
    // Check if deal is approved (APPROVED status means payment schedule should exist)
    const isApproved = deal.statusName === 'APPROVED'
    
    // Build base schedule from dataIn or calculate it
    let baseSchedule: Array<{ date: string; amount: number; status: string; number: number }> = []
    
    // If payment schedule exists in dataIn, use it
    if (deal.dataIn.paymentSchedule && Array.isArray(deal.dataIn.paymentSchedule)) {
      baseSchedule = deal.dataIn.paymentSchedule.map((p: any) => ({
        date: p.date || '',
        amount: p.amount || 0,
        status: p.status || 'Ожидается',
        number: p.number || 0,
      }))
    } else if (isApproved) {
      // Calculate it from deal data (only for approved deals)
      const productPrice = parseFloat(String(deal.dataIn.productPrice || deal.dataIn.purchasePrice || '0'))
      const downPayment = parseFloat(String(deal.dataIn.downPayment || '0'))
      const installmentTerm = deal.dataIn.term?.[0] || parseFloat(String(deal.dataIn.installmentTerm || '0'))
      const monthlyPayment = parseFloat(String(deal.dataIn.monthlyPayment || '0'))
      
      if (productPrice > 0 && installmentTerm > 0) {
        // Calculate remaining amount after down payment
        const remainingAmount = productPrice - downPayment
        const calculatedMonthlyPayment = monthlyPayment > 0 ? monthlyPayment : remainingAmount / installmentTerm
        
        // Start date: 30 days from deal creation or today
        const startDate = new Date(deal.createdAt || new Date())
        startDate.setDate(startDate.getDate() + 30)
        
        for (let i = 0; i < installmentTerm; i++) {
          const paymentDate = new Date(startDate)
          paymentDate.setMonth(paymentDate.getMonth() + i)
          
          // Last payment might be slightly different to account for rounding
          const isLastPayment = i === installmentTerm - 1
          const amount = isLastPayment 
            ? remainingAmount - (calculatedMonthlyPayment * (installmentTerm - 1))
            : calculatedMonthlyPayment
          
          baseSchedule.push({
            date: paymentDate.toISOString().split('T')[0],
            amount: Math.round(amount * 100) / 100,
            status: 'Ожидается',
            number: i + 1,
          })
        }
      }
    }
    
    // If no base schedule, return empty array
    if (baseSchedule.length === 0) {
      return []
    }
    
    // Merge with actual finances data
    // Match finances by paymentNumber or order
    const enrichedSchedule = baseSchedule.map((payment) => {
      // Try to find matching finance by paymentNumber first, then by order
      const matchingFinance = finances.find((f) => {
        if (f.paymentNumber !== null && f.paymentNumber === payment.number) {
          return true
        }
        if (f.order === payment.number) {
          return true
        }
        return false
      })
      
      if (matchingFinance) {
        // Override with actual finance data
        return {
          ...payment,
          amount: matchingFinance.sum, // Use actual sum from finance
          status: matchingFinance.statusName === 'PAID' 
            ? 'Оплачен' 
            : matchingFinance.statusName === 'OVERDUE' 
            ? 'Просрочен' 
            : 'Ожидается',
          date: matchingFinance.paymentDate || payment.date, // Use paymentDate from finance if available
          paidAt: matchingFinance.paidAt, // Add paidAt if available
        }
      }
      
      return payment
    })
    
    return enrichedSchedule
  }, [deal, finances])

  // Prepare chart data from payment schedule
  const chartData = React.useMemo(() => {
    if (!paymentSchedule || paymentSchedule.length === 0) return []
    
    return paymentSchedule.map((payment: any, index: number) => ({
      month: `Месяц ${index + 1}`,
      amount: payment.amount || 0,
      date: payment.date || '',
      number: index + 1,
    }))
  }, [paymentSchedule])

  const chartConfig = {
    amount: {
      label: 'Сумма',
      color: 'hsl(var(--chart-2))',
    },
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              {deal.dataIn.firstName} {deal.dataIn.lastName} - {deal.id}
            </h1>
            {/* Priority Badge */}
            {deal.dataIn.priority === 'high' && (
              <Badge variant="destructive" className="text-base px-4 py-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                High Priority
              </Badge>
            )}
            {deal.dataIn.priority === 'medium' && (
              <Badge variant="secondary" className="text-base px-4 py-2">
                Medium Priority
              </Badge>
            )}
          </div>
          
          {/* Priority Reason */}
          {deal.dataIn.priority === 'high' && deal.dataIn.priorityReason && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                Причина высокого приоритета:
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {deal.dataIn.priorityReason}
              </p>
              {deal.dataIn.priorityUpdatedAt && (
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                  Обновлено: {formatDate(deal.dataIn.priorityUpdatedAt)}
                </p>
              )}
            </div>
          )}

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
                      <AvatarImage
                        src={
                          humanClient?.dataIn?.avatarMedia?.uuid
                            ? `/api/esnad/v1/media/${humanClient.dataIn.avatarMedia.uuid}`
                            : undefined
                        }
                        alt={deal.dataIn.firstName}
                      />
                      <AvatarFallback>
                        {deal.dataIn.firstName?.[0] ?? ''}
                        {deal.dataIn.lastName ? ` ${deal.dataIn.lastName[0]}` : ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{deal.dataIn.firstName} {deal.dataIn.lastName}</p>
                      <p className="text-sm text-muted-foreground">{deal.dataIn.phone}</p>
                      <p className="text-sm text-muted-foreground">{deal.dataIn.email}</p>
                    </div>
                  </div>
                  <Link href={`/admin/users/${humanClient?.user?.uuid}`}>
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
                        <TableCell>{deal.dataIn.productName || 'не указано'}</TableCell>
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
                        {(() => {
                          // financial data from human profile (admin-filled) has priority over deal snapshot
                          const rawHumanDataIn = humanClient?.dataIn
                          const humanDataIn =
                            rawHumanDataIn && typeof rawHumanDataIn === 'string'
                              ? (() => {
                                  try {
                                    return JSON.parse(rawHumanDataIn)
                                  } catch {
                                    return {}
                                  }
                                })()
                              : (rawHumanDataIn as any) || {}

                          const monthlyIncome =
                            humanDataIn.monthlyIncome ??
                            deal.dataIn.monthlyIncome ??
                            deal.dataIn.officialIncome_sb

                          const monthlyExpenses =
                            humanDataIn.monthlyExpenses ?? deal.dataIn.monthlyExpenses

                          const workPlace =
                            humanDataIn.workPlace ??
                            deal.dataIn.workPlace ??
                            deal.dataIn.employmentInfo_sb

                          const workExperience =
                            humanDataIn.workExperience ?? deal.dataIn.workExperience

                          const formatMoney = (value: any) => {
                            if (value === undefined || value === null || value === '') return 'не указано'
                            const num = Number(value)
                            if (Number.isNaN(num)) return String(value)
                            return `${num.toLocaleString('ru-RU')} руб.`
                          }

                          return (
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">Доход в месяц</TableCell>
                                  <TableCell>{formatMoney(monthlyIncome)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Расходы в месяц</TableCell>
                                  <TableCell>{formatMoney(monthlyExpenses)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Место работы</TableCell>
                                  <TableCell>{workPlace || 'не указано'}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Стаж работы</TableCell>
                                  <TableCell>{workExperience || 'не указано'}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          )
                        })()}
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
                          {(() => {
                            const dataInExtended = deal.dataIn as LoanApplicationDataIn & { documentPhotos?: string[] }
                            const documentUuids = dataInExtended.documentPhotos || []
                            const allDocuments: Array<{ uuid: string; label: string; source: 'deal' | 'kyc' }> = []
                            
                            // Add deal documents
                            documentUuids.forEach((uuid) => {
                              allDocuments.push({ uuid, label: 'Фото товара', source: 'deal' })
                            })
                            
                            // Add KYC documents: selfie, selfie_with_passport, passport_registration, income certificate, etc.
                            humanKycDocuments.forEach((doc) => {
                              let label = 'KYC документ'
                              if (doc.type === 'selfie') {
                                label = 'Селфи клиента'
                              } else if (doc.type === 'selfie_with_passport') {
                                label = 'Селфи с паспортом'
                              } else if (doc.type === 'passport_registration') {
                                label = 'Паспорт (страница с регистрацией)'
                              } else if (doc.type === 'other') {
                                label = 'Справка о доходах'
                              }
                              allDocuments.push({ uuid: doc.mediaUuid, label, source: 'kyc' })
                            })
                            
                            if (allDocuments.length === 0) {
                              return (
                                <p className="text-sm text-muted-foreground">Документы не загружены</p>
                              )
                            }
                            
                            return allDocuments.map((doc) => {
                              const metadata = documentMetadata[doc.uuid]
                              const fileName = metadata?.fileName 
                                ? metadata.fileName
                                : `Документ ${doc.uuid.slice(0, 8)}...`
                              
                              return (
                                <div
                                  key={doc.uuid}
                                  className="flex items-center justify-between p-2 border rounded">
                                  <div>
                                    <p className="text-sm font-medium">{doc.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {fileName}
                                    </p>
                                    {metadata && (
                                      <p className="text-xs text-muted-foreground">
                                        UUID: {doc.uuid}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const url = `/api/esnad/v1/admin/files/${doc.uuid}`
                                      const width = 1200
                                      const height = 800
                                      const left = (window.screen.width - width) / 2
                                      const top = (window.screen.height - height) / 2
                                      window.open(
                                        url,
                                        '_blank',
                                        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
                                      )
                                    }}>
                                    Просмотр
                                  </Button>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Колонка 3: Принятие решения */}
            <div className="space-y-4">
              {/* Priority Management Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Приоритет заявки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {priorityError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {priorityError}
                    </div>
                  )}
                  {prioritySuccess && (
                    <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                      Приоритет успешно обновлен
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Приоритет</Label>
                    <Select
                      value={priorityData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setPriorityData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Низкий)</SelectItem>
                        <SelectItem value="medium">Medium (Средний)</SelectItem>
                        <SelectItem value="high">High (Высокий)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priorityReason">Причина (опционально)</Label>
                    <Textarea
                      id="priorityReason"
                      value={priorityData.priorityReason}
                      onChange={(e) =>
                        setPriorityData((prev) => ({ ...prev, priorityReason: e.target.value }))
                      }
                      placeholder="Укажите причину приоритета..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {priorityData.priorityReason.length}/500 символов
                    </p>
                  </div>
                  <Button
                    onClick={handlePriorityUpdate}
                    disabled={prioritySaving}
                    className="w-full"
                  >
                    {prioritySaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить приоритет
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

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
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, manager: value }))}
                      disabled={loadingManagers}>
                      <SelectTrigger id="manager">
                        <SelectValue placeholder={loadingManagers ? "Загрузка менеджеров..." : "Выберите менеджера"} />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.length === 0 && !loadingManagers && (
                          <SelectItem value="" disabled>Менеджеры не найдены</SelectItem>
                        )}
                        {managers.map((manager) => (
                          <SelectItem key={manager.uuid} value={manager.uuid}>
                            {manager.fullName || manager.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    {actionError && (
                      <p className="text-sm text-destructive">
                        {actionError}
                      </p>
                    )}
                    {(deal.statusName === 'SCORING' || deal.statusName === 'ADDITIONAL_INFO_REQUESTED') && (
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
                    )}

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

          {/* График платежей - только для одобренных сделок */}
          {paymentSchedule && paymentSchedule.length > 0 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>График платежей</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full mb-6">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => formatCurrency(Number(value))}
                            labelFormatter={(label, payload) => {
                              const data = payload?.[0]?.payload
                              return data?.date ? `${label} (${formatDate(data.date)})` : label
                            }}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--chart-2))"
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  ) : null}
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSchedule.map((payment: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{payment.number || index + 1}</TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.amount || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPaymentStatusIcon(payment.status || 'Ожидается')}
                              <span>{payment.status || 'Ожидается'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

