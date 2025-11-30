'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, Loader2, Save, ArrowLeft, FileText, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Role {
  uuid: string
  raid: string | null
  title: string | null
  name: string | null
  description: string | null
  isSystem: boolean | null
}

interface User {
  uuid: string
  email: string
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  roles?: Role[]
  human?: {
    fullName: string | null
    dataIn?: any
    birthday?: string | null
    email?: string | null
  }
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const uuid = params?.uuid as string

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [user, setUser] = React.useState<User | null>(null)
  const [roles, setRoles] = React.useState<Role[]>([])

  const [formData, setFormData] = React.useState({
    email: '',
    fullName: '',
    password: '',
    isActive: true,
    emailVerified: false,
    roleUuids: [] as string[],
  })

  const [rolePopoverOpen, setRolePopoverOpen] = React.useState(false)

  React.useEffect(() => {
    if (uuid) {
      fetchUser()
      fetchRoles()
    }
  }, [uuid])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/esnad/v1/admin/users/${uuid}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string; error?: string }
        throw new Error(errorData.message || errorData.error || 'Failed to fetch user')
      }

      const data = await response.json() as { success?: boolean; user?: User; error?: string; message?: string }
      if (data.success && data.user) {
        setUser(data.user)
        setFormData({
          email: data.user.email || '',
          fullName: data.user.human?.fullName || '',
          password: '',
          isActive: data.user.isActive ?? true,
          emailVerified: !!data.user.emailVerifiedAt,
          roleUuids: data.user.roles?.map((r: Role) => r.uuid) || [],
        })
      } else {
        throw new Error(data.message || 'User not found')
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/esnad/v1/admin/roles', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await response.json() as { docs?: Role[]; success?: boolean; roles?: Role[] }
      // API returns { docs: Role[] } format
      if (Array.isArray(data.docs)) {
        setRoles(data.docs)
      } else if (data.success && Array.isArray(data.roles)) {
        // Fallback for alternative format
        setRoles(data.roles)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: any = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        isActive: formData.isActive,
        emailVerified: formData.emailVerified,
        roleUuids: formData.roleUuids,
      }

      // Only include password if it's not empty
      if (formData.password.trim() !== '') {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/esnad/v1/admin/users/${uuid}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string; error?: string }
        throw new Error(errorData.message || errorData.error || 'Failed to update user')
      }

      const data = await response.json() as { success?: boolean; user?: User; message?: string }
      if (data.success) {
        setSuccess(true)
        if (data.user) {
          setUser(data.user)
        }
        // Clear password field after successful save
        setFormData((prev) => ({ ...prev, password: '' }))
        // Redirect after 1 second
        setTimeout(() => {
          router.push('/admin/users')
        }, 1000)
      } else {
        throw new Error(data.message || 'Failed to update user')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const selectedRoles = roles.filter((role) => formData.roleUuids.includes(role.uuid))

  if (loading) {
    return (
      <>
        <AdminHeader title="Редактировать пользователя" />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    )
  }

  if (error && !user) {
    return (
      <>
        <AdminHeader title="Редактировать пользователя" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Link href="/admin/users">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Вернуться к списку пользователей
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Редактировать пользователя" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            </Link>
          </div>

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Пользователь успешно обновлен. Перенаправление...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
              <CardDescription>
                Обновите данные пользователя. Оставьте пароль пустым, чтобы не изменять его.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="Иван Иванов"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Новый пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Оставьте пустым, чтобы не изменять"
                  />
                  <p className="text-sm text-muted-foreground">
                    Оставьте поле пустым, если не хотите изменять пароль
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked === true }))
                    }
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Активен
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailVerified"
                    checked={formData.emailVerified}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, emailVerified: checked === true }))
                    }
                  />
                  <Label htmlFor="emailVerified" className="cursor-pointer">
                    Email подтвержден
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Роли</Label>
                  <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        aria-expanded={rolePopoverOpen}>
                        <span className="truncate">
                          {selectedRoles.length > 0
                            ? selectedRoles.length === 1
                              ? selectedRoles[0].title || selectedRoles[0].name || selectedRoles[0].raid || 'Роль'
                              : `Выбрано: ${selectedRoles.length}`
                            : 'Выберите роли...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Поиск ролей..." />
                        <CommandList>
                          <CommandEmpty>Роли не найдены</CommandEmpty>
                          <CommandGroup>
                            {roles.map((role) => {
                              const isSelected = formData.roleUuids.includes(role.uuid)
                              const roleLabel = role.title || role.name || role.raid || 'Роль'
                              return (
                                <CommandItem
                                  key={role.uuid}
                                  value={`${roleLabel} ${role.uuid}`}
                                  onSelect={() => {
                                    setFormData((prev) => {
                                      const newRoleUuids = isSelected
                                        ? prev.roleUuids.filter((id) => id !== role.uuid)
                                        : [...prev.roleUuids, role.uuid]
                                      return { ...prev, roleUuids: newRoleUuids }
                                    })
                                  }}>
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      isSelected ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {roleLabel}
                                  {role.isSystem && (
                                    <Badge variant="secondary" className="ml-2">
                                      Системная
                                    </Badge>
                                  )}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRoles.map((role) => (
                        <Badge key={role.uuid} variant="secondary">
                          {role.title || role.name || role.raid}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                roleUuids: prev.roleUuids.filter((id) => id !== role.uuid),
                              }))
                            }}
                            className="ml-2 hover:text-destructive">
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {user && (
                  <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                    <div>
                      <strong>UUID:</strong> {user.uuid}
                    </div>
                    <div>
                      <strong>Создан:</strong>{' '}
                      {new Date(user.createdAt).toLocaleString('ru-RU')}
                    </div>
                    <div>
                      <strong>Обновлен:</strong>{' '}
                      {new Date(user.updatedAt).toLocaleString('ru-RU')}
                    </div>
                    {user.emailVerifiedAt && (
                      <div>
                        <strong>Email подтвержден:</strong>{' '}
                        {new Date(user.emailVerifiedAt).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                  <Link href="/admin/users">
                    <Button type="button" variant="outline">
                      Отмена
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Данные из заявки */}
          {user && user.human?.dataIn && (
            <Card>
              <CardHeader>
                <CardTitle>Данные из заявки</CardTitle>
                <CardDescription>
                  Информация, заполненная пользователем при оформлении заявки
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const dataIn = typeof user.human!.dataIn === 'string' 
                      ? JSON.parse(user.human!.dataIn) 
                      : user.human!.dataIn
                    
                    const fields = [
                      { key: 'firstName', label: 'Имя' },
                      { key: 'lastName', label: 'Фамилия' },
                      { key: 'middleName', label: 'Отчество' },
                      { key: 'phone', label: 'Телефон' },
                      { key: 'dateOfBirth', label: 'Дата рождения' },
                      { key: 'placeOfBirth', label: 'Место рождения' },
                      { key: 'citizenship', label: 'Гражданство' },
                      { key: 'maritalStatus', label: 'Семейное положение' },
                      { key: 'numberOfChildren', label: 'Количество детей' },
                      { key: 'passportSeries', label: 'Серия паспорта' },
                      { key: 'passportNumber', label: 'Номер паспорта' },
                      { key: 'passportIssueDate', label: 'Дата выдачи паспорта' },
                      { key: 'passportIssuedBy', label: 'Кем выдан паспорт' },
                      { key: 'passportDivisionCode', label: 'Код подразделения' },
                      { key: 'inn', label: 'ИНН' },
                      { key: 'snils', label: 'СНИЛС' },
                      { key: 'permanentAddress', label: 'Постоянное место жительства' },
                      { key: 'registrationAddress', label: 'Адрес регистрации' },
                    ]

                    return (
                      <div className="grid gap-4 md:grid-cols-2">
                        {fields.map((field) => {
                          const value = dataIn[field.key]
                          if (!value) return null
                          return (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">
                                {field.label}
                              </Label>
                              <p className="text-sm">{String(value)}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KYC Документы */}
          {user && user.human?.dataIn && (() => {
            const dataIn = typeof user.human!.dataIn === 'string' 
              ? JSON.parse(user.human!.dataIn) 
              : user.human!.dataIn
            
            const kycDocuments = dataIn?.kycDocuments || []
            
            if (kycDocuments.length === 0) {
              return null
            }

            const getDocumentTypeLabel = (type: string) => {
              const typeMap: Record<string, string> = {
                'passport_main': 'Паспорт (главная страница)',
                'passport_registration': 'Паспорт (страница с регистрацией)',
                'selfie': 'Селфи',
                'other': 'Справка о доходах',
              }
              return typeMap[type] || type
            }

            const getStatusIcon = (status?: string) => {
              switch (status) {
                case 'verified':
                  return <CheckCircle className="h-4 w-4 text-green-600" />
                case 'pending':
                  return <Clock className="h-4 w-4 text-yellow-600" />
                case 'rejected':
                  return <XCircle className="h-4 w-4 text-red-600" />
                default:
                  return <Clock className="h-4 w-4 text-gray-400" />
              }
            }

            const getStatusLabel = (status?: string) => {
              switch (status) {
                case 'verified':
                  return 'Верифицирован'
                case 'pending':
                  return 'На проверке'
                case 'rejected':
                  return 'Отклонен'
                default:
                  return 'Ожидает проверки'
              }
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle>KYC Документы</CardTitle>
                  <CardDescription>
                    Документы, загруженные пользователем для верификации
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {kycDocuments.map((doc: any, index: number) => {
                        const fileUrl = `/api/esnad/v1/admin/files/${doc.mediaUuid}`
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getDocumentTypeLabel(doc.type)}</span>
                                  {getStatusIcon(doc.status)}
                                  <Badge variant="outline" className="text-xs">
                                    {getStatusLabel(doc.status)}
                                  </Badge>
                                </div>
                                {doc.uploadedAt && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Загружен: {new Date(doc.uploadedAt).toLocaleString('ru-RU')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const width = 1200
                                const height = 800
                                const left = (window.screen.width - width) / 2
                                const top = (window.screen.height - height) / 2
                                window.open(
                                  fileUrl,
                                  '_blank',
                                  `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
                                )
                              }}
                              className="flex items-center gap-2">
                              <span className="text-sm">Открыть</span>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                    {dataIn?.kycStatus && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Статус верификации:</span>
                          <Badge variant={
                            dataIn.kycStatus === 'verified' ? 'default' :
                            dataIn.kycStatus === 'rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {dataIn.kycStatus === 'verified' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {dataIn.kycStatus === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                            {dataIn.kycStatus === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                            {getStatusLabel(dataIn.kycStatus)}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      </main>
    </>
  )
}

