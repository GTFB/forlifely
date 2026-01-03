"use client"

import * as React from "react"
import { AppSidebar } from "@/components/application-blocks/app-sidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, X } from "lucide-react"
import { LANGUAGES, PROJECT_SETTINGS } from "@/settings"

type AdminProfile = {
  id: string
  uuid: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  middleName?: string
  avatarMediaUuid?: string
}

type LanguageCode = (typeof LANGUAGES)[number]["code"]

function parseFullNameToParts(fullName: string): { firstName: string; lastName: string; middleName: string } {
  const raw = (fullName || "").trim()
  if (!raw) return { firstName: "", lastName: "", middleName: "" }

  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: "", middleName: "" }

  const hasCyrillic = /[А-Яа-яЁё]/.test(raw)
  if (hasCyrillic) {
    return {
      lastName: parts[0] || "",
      firstName: parts[1] || "",
      middleName: parts.slice(2).join(" "),
    }
  }
  return {
    firstName: parts[0] || "",
    lastName: parts[1] || "",
    middleName: parts.slice(2).join(" "),
  }
}

function getInitials(firstName?: string, lastName?: string, name?: string, email?: string): string {
  const fn = (firstName || "").trim()
  const ln = (lastName || "").trim()
  if (fn || ln) {
    return ((fn[0] || "") + (ln[0] || "")).toUpperCase() || (fn.slice(0, 2) || "U").toUpperCase()
  }

  const source = (name || "").trim() || (email || "").trim()
  if (!source) return "U"

  const parts = source
    .replace(/[@._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function AdminProfilePageClient() {
  const [profile, setProfile] = React.useState<AdminProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null)
  const [changingPassword, setChangingPassword] = React.useState(false)

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    middleName: "",
  })

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const supportedLanguageCodes = React.useMemo(() => LANGUAGES.map((l) => l.code), [])
  const [locale, setLocale] = React.useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-locale")
      if (saved && supportedLanguageCodes.includes(saved as LanguageCode)) {
        return saved as LanguageCode
      }
    }
    const defaultLang = PROJECT_SETTINGS.defaultLanguage
    if (supportedLanguageCodes.includes(defaultLang as LanguageCode)) {
      return defaultLang as LanguageCode
    }
    return LANGUAGES[0]?.code || ("en" as LanguageCode)
  })

  const [translations, setTranslations] = React.useState<any>(null)

  React.useEffect(() => {
    const handleLocaleChanged = (e: StorageEvent | CustomEvent) => {
      const newLocale = (e as CustomEvent).detail || (e as StorageEvent).newValue
      if (newLocale && supportedLanguageCodes.includes(newLocale as LanguageCode)) {
        setLocale(newLocale as LanguageCode)
      }
    }

    window.addEventListener("storage", handleLocaleChanged as EventListener)
    window.addEventListener("sidebar-locale-changed", handleLocaleChanged as EventListener)
    return () => {
      window.removeEventListener("storage", handleLocaleChanged as EventListener)
      window.removeEventListener("sidebar-locale-changed", handleLocaleChanged as EventListener)
    }
  }, [supportedLanguageCodes])

  React.useEffect(() => {
    const loadTranslations = async () => {
      try {
        const cacheKey = `sidebar-translations-${locale}`
        const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null
        if (cached) {
          try {
            setTranslations(JSON.parse(cached))
          } catch {
            // ignore
          }
        }
        const res = await fetch(`/api/locales/${locale}`)
        if (!res.ok) throw new Error(`Failed to load translations: ${res.status}`)
        const json = await res.json()
        setTranslations(json)
        if (typeof window !== "undefined") sessionStorage.setItem(cacheKey, JSON.stringify(json))
      } catch {
        // fallback to en
        try {
          const res = await fetch(`/api/locales/en`)
          if (!res.ok) return
          const json = await res.json()
          setTranslations(json)
        } catch {
          // ignore
        }
      }
    }
    void loadTranslations()
  }, [locale])

  const tProfile = React.useMemo(() => {
    const p = translations?.profile
    return (
      p || {
        title: "Profile",
        tabs: { personal: "Personal", security: "Security" },
        fields: {
          avatar: "Avatar",
          firstName: "First name",
          lastName: "Last name",
          middleName: "Middle name",
          currentPassword: "Current password",
          newPassword: "New password",
          confirmPassword: "Confirm new password",
        },
        actions: {
          save: "Save",
          saving: "Saving...",
          changePassword: "Change password",
          changing: "Saving...",
          removeAvatar: "Remove avatar",
          removing: "Removing...",
        },
        alerts: { errorTitle: "Error", successTitle: "Success" },
        messages: { profileUpdated: "Profile updated", avatarUpdated: "Avatar updated", passwordUpdated: "Password updated" },
        errors: {
          loadProfile: "Failed to load profile",
          updateProfile: "Failed to update profile",
          uploadAvatar: "Failed to upload avatar",
          removeAvatar: "Failed to remove avatar",
          changePassword: "Failed to change password",
          required: "All fields are required",
          mismatch: "Passwords do not match",
        },
      }
    )
  }, [translations])

  const fetchProfile = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/esnad/v1/admin/profile", { credentials: "include" })
      if (!res.ok) throw new Error(tProfile.errors.loadProfile)
      const json = (await res.json()) as { profile: AdminProfile }
      setProfile(json.profile)
      const parsed = parseFullNameToParts(json.profile.name || "")
      setFormData({
        firstName: json.profile.firstName || parsed.firstName || "",
        lastName: json.profile.lastName || parsed.lastName || "",
        middleName: json.profile.middleName || parsed.middleName || "",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : tProfile.errors.loadProfile)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/esnad/v1/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleName: formData.middleName.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(json?.message || tProfile.errors.updateProfile)
      }
      setSuccess(tProfile.messages.profileUpdated)
      await fetchProfile()
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : tProfile.errors.updateProfile)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/esnad/v1/admin/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(json?.message || tProfile.errors.uploadAvatar)
      }
      const json = (await res.json().catch(() => null)) as { avatarMediaUuid?: string } | null
      setSuccess(tProfile.messages.avatarUpdated)
      await fetchProfile()
      setTimeout(() => setSuccess(null), 2500)

      // Best-effort update sidebar cached user avatar without full reload
      try {
        const avatarMediaUuid = json?.avatarMediaUuid
        if (avatarMediaUuid && typeof window !== "undefined") {
          const cachedUser = sessionStorage.getItem("sidebar-user")
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser)
            const next = {
              ...parsed,
              avatarUrl: `/api/esnad/v1/media/${avatarMediaUuid}`,
            }
            sessionStorage.setItem("sidebar-user", JSON.stringify(next))
            window.dispatchEvent(new CustomEvent("sidebar-user-updated", { detail: next }))
          } else {
            window.dispatchEvent(
              new CustomEvent("sidebar-user-updated", {
                detail: { avatarUrl: `/api/esnad/v1/media/${avatarMediaUuid}` },
              }),
            )
          }
        }
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tProfile.errors.uploadAvatar)
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarRemove = async () => {
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/esnad/v1/admin/profile/avatar", {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(json?.message || tProfile.errors.removeAvatar)
      }
      setSuccess(tProfile.messages.avatarUpdated)
      await fetchProfile()
      setTimeout(() => setSuccess(null), 2500)

      if (typeof window !== "undefined") {
        const cachedUser = sessionStorage.getItem("sidebar-user")
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser)
          const next = { ...parsed, avatarUrl: null }
          sessionStorage.setItem("sidebar-user", JSON.stringify(next))
          window.dispatchEvent(new CustomEvent("sidebar-user-updated", { detail: next }))
        } else {
          window.dispatchEvent(new CustomEvent("sidebar-user-updated", { detail: { avatarUrl: null } }))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tProfile.errors.removeAvatar)
    } finally {
      setUploading(false)
    }
  }

  const handlePasswordChange = async () => {
    setChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError(tProfile.errors.required)
        return
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError(tProfile.errors.mismatch)
        return
      }
      const res = await fetch("/api/esnad/v1/admin/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(json?.message || tProfile.errors.changePassword)
      }
      setPasswordSuccess(tProfile.messages.passwordUpdated)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setPasswordSuccess(null), 2500)
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : tProfile.errors.changePassword)
      setPasswordSuccess(null)
    } finally {
      setChangingPassword(false)
    }
  }

  const avatarSrc = profile?.avatarMediaUuid ? `/api/esnad/v1/media/${profile.avatarMediaUuid}` : null
  const initials = React.useMemo(() => {
    return getInitials(formData.firstName, formData.lastName, profile?.name, profile?.email)
  }, [formData.firstName, formData.lastName, profile?.name, profile?.email])

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader title={tProfile.title} />
          <main className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-6">
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>{tProfile.alerts.errorTitle}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {success ? (
                  <Alert>
                    <AlertTitle>{tProfile.alerts.successTitle}</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                ) : null}

                <Tabs defaultValue="personal" className="space-y-4">
                  <TabsList className="bg-primary-foreground">
                    <TabsTrigger className="data-[state=active]:bg-primary-foreground" value="personal">
                      {tProfile.tabs.personal}
                    </TabsTrigger>
                    <TabsTrigger className="data-[state=active]:bg-primary-foreground" value="security">
                      {tProfile.tabs.security}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{tProfile.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border">
                            {avatarSrc ? <AvatarImage src={avatarSrc} alt={tProfile.fields.avatar} /> : null}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="avatar">{tProfile.fields.avatar}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                disabled={uploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void handleAvatarUpload(file)
                                }}
                              />
                              {profile?.avatarMediaUuid ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  disabled={uploading}
                                  aria-label={tProfile.actions.removeAvatar}
                                  title={tProfile.actions.removeAvatar}
                                  onClick={() => void handleAvatarRemove()}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">{tProfile.fields.firstName}</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">{tProfile.fields.lastName}</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="middleName">{tProfile.fields.middleName}</Label>
                            <Input
                              id="middleName"
                              value={formData.middleName}
                              onChange={(e) => setFormData((p) => ({ ...p, middleName: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={() => void handleSave()} disabled={saving}>
                            {saving ? tProfile.actions.saving : tProfile.actions.save}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{tProfile.tabs.security}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {passwordError ? (
                          <Alert variant="destructive">
                            <AlertTitle>{tProfile.alerts.errorTitle}</AlertTitle>
                            <AlertDescription>{passwordError}</AlertDescription>
                          </Alert>
                        ) : null}
                        {passwordSuccess ? (
                          <Alert>
                            <AlertTitle>{tProfile.alerts.successTitle}</AlertTitle>
                            <AlertDescription>{passwordSuccess}</AlertDescription>
                          </Alert>
                        ) : null}

                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">{tProfile.fields.currentPassword}</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">{tProfile.fields.newPassword}</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">{tProfile.fields.confirmPassword}</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={() => void handlePasswordChange()} disabled={changingPassword}>
                            {changingPassword ? tProfile.actions.changing : tProfile.actions.changePassword}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}


