'use client'

import * as React from 'react'
import { InstallmentApplicationForm } from '@/components/cabinet/forms/InstallmentApplicationForm'
import { EsnadHuman } from '@/shared/types/esnad'

export default function NewDealPage() {
  const [human, setHuman] = React.useState<EsnadHuman | undefined>(undefined)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchHuman = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/esnad/v1/c/human', {
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({ error: 'Не удалось загрузить профиль' }))) as { error?: string; message?: string }
          throw new Error(errorData.message || errorData.error || 'Не удалось загрузить профиль')
        }

        const data = (await response.json()) as {
          success: boolean
          human?: EsnadHuman
        }

        if (data.success && data.human) {
          setHuman(data.human)
        } else {
          throw new Error('Профиль не найден')
        }
        setLoading(false)
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль')
        setLoading(false)
      }
    }

    fetchHuman()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Новая заявка на рассрочку</h1>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Новая заявка на рассрочку</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Новая заявка на рассрочку</h1>
      <InstallmentApplicationForm human={human} />
    </div>
  )
}

