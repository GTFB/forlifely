'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export default function PartnerProfilePage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    inn: '',
    kpp: '',
    ogrn: '',
    bankName: '',
    bankAccount: '',
    correspondentAccount: '',
    bik: '',
  })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/p/profile', { credentials: 'include' })
        setLoading(false)
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // TODO: Implement save API
      // const response = await fetch('/api/p/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify(formData),
      // })

      setError('Сохранение профиля пока не реализовано')
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Профиль магазина</h1>

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название магазина *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Название магазина"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Полный адрес магазина"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Реквизиты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН</Label>
              <Input
                id="inn"
                value={formData.inn}
                onChange={(e) => setFormData((prev) => ({ ...prev, inn: e.target.value }))}
                placeholder="ИНН"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpp">КПП</Label>
              <Input
                id="kpp"
                value={formData.kpp}
                onChange={(e) => setFormData((prev) => ({ ...prev, kpp: e.target.value }))}
                placeholder="КПП"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogrn">ОГРН</Label>
              <Input
                id="ogrn"
                value={formData.ogrn}
                onChange={(e) => setFormData((prev) => ({ ...prev, ogrn: e.target.value }))}
                placeholder="ОГРН"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Название банка</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
              placeholder="Название банка"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Расчетный счет</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))
                }
                placeholder="Расчетный счет"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correspondentAccount">Корреспондентский счет</Label>
              <Input
                id="correspondentAccount"
                value={formData.correspondentAccount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, correspondentAccount: e.target.value }))
                }
                placeholder="Корреспондентский счет"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bik">БИК</Label>
              <Input
                id="bik"
                value={formData.bik}
                onChange={(e) => setFormData((prev) => ({ ...prev, bik: e.target.value }))}
                placeholder="БИК"
              />
            </div>
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
    </div>
  )
}

