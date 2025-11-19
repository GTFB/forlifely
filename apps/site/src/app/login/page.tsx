"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Globe } from "lucide-react"
import { Logo } from "@/components/misc/logo/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [locale, setLocale] = useState<'en' | 'ru'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved === 'en' || saved === 'ru') {
        return saved
      }
    }
    return 'ru'
  })
  const [translations, setTranslations] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/locales/${locale}`)
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json()
        setTranslations(translationsData)
      } catch (e) {
        console.error('Failed to load translations:', e)
        // Fallback: try dynamic import as backup
        try {
          const translationsModule = locale === 'ru'
            ? await import("@/packages/content/locales/ru.json")
            : await import("@/packages/content/locales/en.json")
          setTranslations(translationsModule.default || translationsModule)
        } catch (fallbackError) {
          console.error('Fallback import also failed:', fallbackError)
        }
      }
    }
    loadTranslations()
  }, [locale])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])


  const handleLocaleChange = (newLocale: 'en' | 'ru') => {
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-locale', newLocale)
      // Dispatch event for sidebar to sync
      window.dispatchEvent(new CustomEvent('sidebar-locale-changed', { detail: newLocale }))
    }
  }

  const navUserTranslations = translations?.navUser || {
    english: "English",
    russian: "Russian"
  }

  const t = translations?.login || {
    title: "Login",
    description: "Enter your credentials to access the admin panel",
    email: "Email",
    password: "Password",
    emailPlaceholder: "admin@example.com",
    passwordPlaceholder: "••••••••",
    loginButton: "Login",
    loggingIn: "Logging in...",
    errors: {
      apiNotFound: "API endpoint not found. Please ensure you are running the development server correctly.\n\nFor local development with Cloudflare Functions, use:\n  npm run dev:all\n\nThis will start both Next.js and Wrangler servers.",
      serverError: "Server error. Please try again later.",
      unexpectedResponse: "Server returned an unexpected response",
      loginFailed: "Login failed",
      unknownError: "Unknown error"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setResendSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        
        // If we get HTML or 404, the endpoint is not available
        if (response.status === 404 || (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype'))) {
          throw new Error(t.errors.apiNotFound)
        }
        
        throw new Error(
          response.status === 500
            ? t.errors.serverError
            : `${t.errors.unexpectedResponse} (${response.status})`
        )
      }

      const data: { 
        error?: string
        success?: boolean
        user?: {
          roles?: Array<{
            dataIn?: string | null
            [key: string]: any
          }>
        }
      } = await response.json()

      if (!response.ok) {
        if ((data as any)?.code === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerification(true)
          setPendingEmail(formData.email)
          setError('Email не подтвержден. Проверьте почту и подтвердите адрес.')
          if ((data as any)?.resendAvailableAt) {
            const availableAt = new Date((data as any).resendAvailableAt).getTime()
            const seconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000))
            setResendCooldown(seconds > 0 ? seconds : 60)
          } else {
            setResendCooldown(60)
          }
          return
        }
        throw new Error(data.error || t.errors.loginFailed)
      }

      // Check if user has Administrator role
      const hasAdministratorRole = data.user?.roles?.some(
        (role) => role.name === 'Administrator' || role.raid === 'Administrator'
      )

      // Check if user has any role with auth_redirect_url
      let redirectUrl = '/admin' // Default for admin
      
      if (data.user?.roles) {
        let foundRedirect = false
        
        for (const role of data.user.roles) {
          if (role.dataIn) {
            try {
              const dataIn = typeof role.dataIn === 'string' 
                ? JSON.parse(role.dataIn) 
                : role.dataIn
              
              if (dataIn?.auth_redirect_url && typeof dataIn.auth_redirect_url === 'string') {
                redirectUrl = dataIn.auth_redirect_url
                foundRedirect = true
                break // Use first match
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }

        // If no custom redirect and user doesn't have Administrator role, redirect to home
        if (!foundRedirect && !hasAdministratorRole) {
          redirectUrl = '/'
        }
      } else if (!hasAdministratorRole) {
        // No roles and no Administrator, redirect to home
        redirectUrl = '/'
      }

      // Redirect to determined URL
      router.push(redirectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.unknownError)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const targetEmail = (pendingEmail || formData.email).trim()
    if (!targetEmail) {
      setError('Укажите email, чтобы отправить письмо повторно.')
      return
    }

    setResendLoading(true)
    setError(null)
    setResendSuccess(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail }),
      })

      const data = (await response
        .json()
        .catch(() => ({}))) as { success?: boolean; error?: string; resendAvailableAt?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить письмо повторно')
      }

      if (data.resendAvailableAt) {
        const targetTime = new Date(data.resendAvailableAt).getTime()
        const seconds = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))
        setResendCooldown(seconds > 0 ? seconds : 60)
      } else {
        setResendCooldown(60)
      }
      setResendSuccess('Письмо для подтверждения отправлено повторно.')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.unknownError)
    } finally {
      setResendLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Globe className="h-4 w-4" />
              <span className="sr-only">Change language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLocaleChange('en')}>
              {navUserTranslations.english} (EN)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLocaleChange('ru')}>
              {navUserTranslations.russian} (RU)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Logo className="h-12" />
          </div>
          <CardTitle className="text-2xl text-center">{t.title}</CardTitle>
          <CardDescription className="text-center">
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t.passwordPlaceholder}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loggingIn}
                </>
              ) : (
                t.loginButton
              )}
            </Button>

            {needsVerification && (
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary-foreground/80 dark:text-primary-foreground">
                <p>Для входа подтвердите email. Отправим письмо повторно по запросу.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={resendLoading || resendCooldown > 0}
                  onClick={handleResendVerification}
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправляем...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Отправить повторно через ${resendCooldown} c`
                  ) : (
                    'Отправить письмо повторно'
                  )}
                </Button>
                {resendSuccess && (
                  <p className="text-xs text-muted-foreground">{resendSuccess}</p>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


