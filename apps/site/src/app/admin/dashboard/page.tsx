"use client"

import * as React from "react"
import { Suspense } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, Package, TrendingUp, FileText } from "lucide-react"

function DashboardContent() {
  const [locale, setLocale] = React.useState<'en' | 'ru'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved === 'en' || saved === 'ru') {
        return saved
      }
    }
    return 'ru'
  })

  const [translations, setTranslations] = React.useState<any>(null)

  React.useEffect(() => {
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

  // Sync locale with sidebar when it changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebar-locale' && e.newValue && (e.newValue === 'en' || e.newValue === 'ru')) {
        setLocale(e.newValue)
      }
    }

    const handleLocaleChanged = (e: CustomEvent) => {
      if (e.detail === 'en' || e.detail === 'ru') {
        setLocale(e.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)
    }
  }, [])

  const t = React.useMemo(() => {
    if (!translations?.dashboard) {
      return {
        title: "Dashboard",
        description: "Welcome to the admin panel. Overview of your system.",
        adminPanel: "Admin Panel",
        totalUsers: "Total Users",
        registeredUsers: "Registered users",
        collections: "Collections",
        availableCollections: "Available collections",
        deals: "Deals",
        activeDeals: "Active deals",
        documents: "Documents",
        totalDocuments: "Total documents",
        quickActions: "Quick Actions",
        commonTasks: "Common administrative tasks",
        manageUsers: "Manage Users",
        viewEditUsers: "View and edit users",
        manageDeals: "Manage Deals",
        viewEditDeals: "View and edit deals",
        manageProducts: "Manage Products",
        viewEditProducts: "View and edit products",
      }
    }
    return translations.dashboard
  }, [translations])
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalCollections: 0,
    totalDeals: 0,
    totalDocuments: 0,
    loading: true,
  })

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // Загружаем базовую статистику
        const [usersRes, collectionsRes] = await Promise.all([
          fetch("/api/admin/collections?c=users", { credentials: "include" }),
          fetch("/api/admin/collections", { credentials: "include" }),
        ])

        let totalUsers = 0
        if (usersRes.ok) {
          const usersData = await usersRes.json() as { total?: number }
          totalUsers = usersData.total || 0
        }

        let totalCollections = 0
        if (collectionsRes.ok) {
          const collectionsData: { groups?: Array<{ collections?: any[] }> } = await collectionsRes.json()
          totalCollections = collectionsData.groups?.reduce(
            (acc: number, group: any) => acc + (group.collections?.length || 0),
            0
          ) || 0
        }

        setStats({
          totalUsers,
          totalCollections,
          totalDeals: 0,
          totalDocuments: 0,
          loading: false,
        })
      } catch (error) {
        console.error("Failed to load stats:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    loadStats()
  }, [])

  const breadcrumbItems = React.useMemo(() => [
    { label: t.adminPanel, href: "/admin/dashboard" },
    { label: t.title },
  ], [t.adminPanel, t.title])

  return (
    <>
      <AdminHeader title={t.title} breadcrumbItems={breadcrumbItems} />
      <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">
                  {t.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.totalUsers}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.loading ? "..." : stats.totalUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.registeredUsers}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.collections}
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.loading ? "..." : stats.totalCollections}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.availableCollections}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.deals}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.loading ? "..." : stats.totalDeals}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.activeDeals}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t.documents}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.loading ? "..." : stats.totalDocuments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.totalDocuments}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t.quickActions}</CardTitle>
                  <CardDescription>
                    {t.commonTasks}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <a
                      href="/admin?c=users"
                      className="flex items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <Users className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{t.manageUsers}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.viewEditUsers}
                        </div>
                      </div>
                    </a>
                    <a
                      href="/admin?c=deals"
                      className="flex items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <TrendingUp className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{t.manageDeals}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.viewEditDeals}
                        </div>
                      </div>
                    </a>
                    <a
                      href="/admin?c=products"
                      className="flex items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <Package className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{t.manageProducts}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.viewEditProducts}
                        </div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

