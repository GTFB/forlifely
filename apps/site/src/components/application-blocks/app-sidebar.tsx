"use client"

import * as React from "react"
import {
  Contact,
  TrendingUp,
  Megaphone,
  KanbanSquare,
  Truck,
  UsersRound,
  Landmark,
  FolderArchive,
  MessageSquareMore,
  SlidersHorizontal,
  ShieldCheck,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/application-blocks/nav-main"
import { NavUser } from "@/components/application-blocks/nav-user"
import { TeamSwitcher } from "@/components/application-blocks/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useResizableSidebar } from "@/packages/hooks/use-resizable-sidebar"
import { useAdminState } from "@/components/admin/AdminStateProvider"
import { PROJECT_SETTINGS } from "@/settings"

type CollectionsResponse = {
  success: boolean
  total: number
  groups: { category: string; collections: string[] }[]
}

type MeResponse = {
  user?: { id: string; email: string; name: string; role: string }
  error?: string
}

const categoryIcon: Record<string, any> = {
  Contacts: Contact,
  Sales: TrendingUp,
  Marketing: Megaphone,
  Projects: KanbanSquare,
  Logistics: Truck,
  Staff: UsersRound,
  Finance: Landmark,
  Content: FolderArchive,
  Chats: MessageSquareMore,
  Admin: SlidersHorizontal,
  Logs: ShieldCheck,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { handleMouseDown } = useResizableSidebar()
  const { state, pushState } = useAdminState()

  const [groups, setGroups] = React.useState<CollectionsResponse["groups"]>([])
  const [user, setUser] = React.useState<MeResponse["user"] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [locale, setLocale] = React.useState<'en' | 'ru'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved === 'en' || saved === 'ru') {
        return saved
      }
    }
    // Use 'ru' as default (overriding PROJECT_SETTINGS.defaultLanguage for admin panel)
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

  const t = React.useMemo(() => {
    if (!translations) {
      return {
        platform: "Platform",
        category: (category: string) => category,
        collection: (collection: string) => collection,
      }
    }
    return {
      platform: translations?.sidebar?.platform || "Platform",
      category: (category: string): string => {
        return translations?.sidebar?.categories?.[category as keyof typeof translations.sidebar.categories] || category
      },
      collection: (collection: string): string => {
        return translations?.sidebar?.collections?.[collection as keyof typeof translations.sidebar.collections] || collection
      },
    }
  }, [translations])

  const handleLocaleChange = React.useCallback((newLocale: 'en' | 'ru') => {
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-locale', newLocale)
      // Dispatch custom event to notify other components about locale change
      window.dispatchEvent(new CustomEvent('sidebar-locale-changed', { detail: newLocale }))
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [collectionsRes, meRes] = await Promise.all([
          fetch("/api/admin/collections", {
            credentials: "include",
            signal: controller.signal,
          }),
          fetch("/api/auth/me", { credentials: "include", signal: controller.signal }),
        ])
        if (!collectionsRes.ok) throw new Error(`Collections failed: ${collectionsRes.status}`)
        const collectionsJson: CollectionsResponse = await collectionsRes.json()
        setGroups(collectionsJson.groups)

        if (meRes.ok) {
          const meJson: MeResponse = await meRes.json()
          if (meJson.user) setUser(meJson.user)
        }
      } catch (e) {
        if ((e as any).name !== "AbortError") setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const items = React.useMemo(() => {
    const collectionItems = groups.map((group) => ({
      title: t.category(group.category),
      url: "#",
      icon: categoryIcon[group.category] || SquareTerminal,
      isActive: group.collections.includes(state.collection),
      items: group.collections.map((name) => {
        // Build proper URL for the collection
        const params = new URLSearchParams()
        params.set("c", name)
        params.set("p", "1")
        
        return {
          title: t.collection(name),
          url: `/admin?${params.toString()}`,
        }
      }),
    }))

    return collectionItems
  }, [groups, state.collection, pushState, t])

  // Dummy teams source for TeamSwitcher (kept UI parity). Could be enriched later.
  const teams = [{ name: t.category("Admin"), logo: Settings2, plan: "" }]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams as any} translations={translations} />
      </SidebarHeader>
      <SidebarContent>
        {loading && (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="px-3 py-2 text-xs text-destructive">{error}</div>
        )}
        {!loading && !error && <NavMain items={items} platformLabel={t.platform} />}
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser 
            user={{ name: user.name, email: user.email, avatar: "/avatars/placeholder-user.jpg" }}
            locale={locale}
            onLocaleChange={handleLocaleChange}
            translations={translations}
          />
        )}
      </SidebarFooter>
      <SidebarRail onMouseDown={handleMouseDown} />
    </Sidebar>
  )
}
