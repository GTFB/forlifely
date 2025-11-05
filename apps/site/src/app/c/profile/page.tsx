'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info, Upload, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Profile {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  kycStatus?: string
  kycDocuments?: Array<{
    id: string
    name: string
    status: string
    uploadedAt?: string
  }>
}

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    address: '',
  })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/c/profile', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json() as { profile: Profile }
        setProfile(data.profile)
        setFormData({
          name: data.profile.name || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
        })
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/c/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || 'Failed to update profile')
      }

      // Reload profile
      const reloadResponse = await fetch('/api/c/profile', {
        credentials: 'include',
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json() as { profile: Profile }
        setProfile(data.profile)
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getKycStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Верифицирован</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />На проверке</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Отклонен</Badge>
      default:
        return <Badge variant="outline">Не начата</Badge>
    }
  }

  const requiredDocuments = [
    { id: 'passport', name: 'Паспорт (главная страница)', required: true },
    { id: 'passport_registration', name: 'Паспорт (страница с регистрацией)', required: true },
    { id: 'income_certificate', name: 'Справка о доходах', required: true },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Мой профиль</h1>

      <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Личные данные</TabsTrigger>
            <TabsTrigger value="kyc">Документы KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Личные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ФИО *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Адрес проживания"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Документы KYC</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Текущий статус верификации</AlertTitle>
                  <AlertDescription>
                    {getKycStatusBadge(profile?.kycStatus)}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Требуемые документы</h3>
                  <ul className="space-y-4">
                    {requiredDocuments.map((doc) => {
                      const uploadedDoc = profile?.kycDocuments?.find((d) => d.id === doc.id)
                      return (
                        <li key={doc.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{doc.name}</span>
                              {doc.required && (
                                <Badge variant="outline" className="text-xs">Обязательно</Badge>
                              )}
                            </div>
                            {uploadedDoc && (
                              <div className="mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  {uploadedDoc.status === 'verified' && (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  )}
                                  {uploadedDoc.status === 'pending' && (
                                    <Clock className="h-3 w-3 text-yellow-600" />
                                  )}
                                  {uploadedDoc.status === 'rejected' && (
                                    <XCircle className="h-3 w-3 text-red-600" />
                                  )}
                                  <span>Статус: {uploadedDoc.status}</span>
                                  {uploadedDoc.uploadedAt && (
                                    <span>• Загружен: {new Date(uploadedDoc.uploadedAt).toLocaleDateString('ru-RU')}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              id={`file-${doc.id}`}
                              onChange={(e) => {
                                // TODO: Handle file upload
                                console.log('File upload:', doc.id, e.target.files?.[0])
                              }}
                            />
                            <Label
                              htmlFor={`file-${doc.id}`}
                              className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Upload className="mr-2 h-4 w-4" />
                                  {uploadedDoc ? 'Заменить' : 'Загрузить'}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  )
}

