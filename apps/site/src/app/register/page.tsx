"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/misc/logo/logo"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleAcceptTermsChange = (checked: boolean | "indeterminate") => {
    setFormData((prev) => ({
      ...prev,
      acceptTerms: checked === true,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.acceptTerms) {
      setError("Необходимо принять условия обработки персональных данных.")
      return
    }

    // Validate required fields
    if (!formData.lastName?.trim()) {
      setError("Фамилия обязательна для заполнения.")
      return
    }

    if (!formData.firstName?.trim()) {
      setError("Имя обязательно для заполнения.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/esnad/v1/auth/register-consumer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          lastName: formData.lastName.trim(),
          firstName: formData.firstName.trim(),
          middleName: formData.middleName?.trim() || undefined,
          phone: formData.phone,
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string; message?: string }
        | null

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Не удалось завершить регистрацию")
      }

      setSuccess(data.message || "Регистрация завершена. Проверьте email, чтобы подтвердить адрес.")
      setCompleted(true)
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Logo className="h-12" />
          </div>
          <CardTitle className="text-2xl text-center">Регистрация</CardTitle>
          <CardDescription className="text-center">
            Создайте аккаунт Потребителя, чтобы подать заявку на рассрочку и управлять платежами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Фамилия <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Иванов"
                  value={formData.lastName}
                  onChange={(e) => {
                    const value = e.target.value
                    const filtered = value.replace(/[^А-Яа-яЁё\s-]/g, '')
                    setFormData((prev) => ({ ...prev, lastName: filtered }))
                  }}
                  required
                  disabled={loading || completed}
                  autoComplete="family-name"
                  pattern="^[А-Яа-яЁё\s-]+$"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Имя <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Иван"
                  value={formData.firstName}
                  onChange={(e) => {
                    const value = e.target.value
                    const filtered = value.replace(/[^А-Яа-яЁё\s-]/g, '')
                    setFormData((prev) => ({ ...prev, firstName: filtered }))
                  }}
                  required
                  disabled={loading || completed}
                  autoComplete="given-name"
                  pattern="^[А-Яа-яЁё\s-]+$"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Отчество</Label>
                <Input
                  id="middleName"
                  type="text"
                  placeholder="Иванович"
                  value={formData.middleName}
                  onChange={(e) => {
                    const value = e.target.value
                    const filtered = value.replace(/[^А-Яа-яЁё\s-]/g, '')
                    setFormData((prev) => ({ ...prev, middleName: filtered }))
                  }}
                  disabled={loading || completed}
                  autoComplete="additional-name"
                  pattern="^[А-Яа-яЁё\s-]+$"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || completed}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 999-99-99"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading || completed}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading || completed}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Подтверждение пароля <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading || completed}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={handleAcceptTermsChange}
                disabled={loading || completed}
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-none">
                Я соглашаюсь с условиями обработки персональных данных и пользовательским соглашением.
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || completed}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Регистрация...
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </Button>

            {completed && (
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>После подтверждения email вы сможете войти в личный кабинет.</p>
                <Button asChild variant="outline">
                  <Link href="/login">Перейти к форме входа</Link>
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


