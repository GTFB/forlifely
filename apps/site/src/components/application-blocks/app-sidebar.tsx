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
import { Logo } from "@/components/misc/logo/logo"

import { NavMain } from "@/components/application-blocks/nav-main"
import { NavUser } from "@/components/application-blocks/nav-user"
import { TeamSwitcher } from "@/components/application-blocks/team-switcher"

// Memoized versions to prevent re-renders
const NavMainMemo = React.memo(NavMain)
const NavUserMemo = React.memo(NavUser)
const TeamSwitcherMemo = React.memo(TeamSwitcher)
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useResizableSidebar } from "@/packages/hooks/use-resizable-sidebar"
import { useAdminState, useAdminCollection } from "@/components/admin/AdminStateProvider"
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

// Global refs to preserve state across component remounts
// These persist even when Next.js remounts the component tree
// In dev mode, Next.js may hot-reload modules, so we also use sessionStorage as backup
function getGlobalRefs() {
  // Try to restore from sessionStorage if available (for dev mode hot-reloads)
  let restoredItems = []
  let restoredItemsStructure = []
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebar-global-items')
      if (stored) {
        restoredItems = JSON.parse(stored)
      }
      const storedStructure = sessionStorage.getItem('sidebar-global-structure')
      if (storedStructure) {
        restoredItemsStructure = JSON.parse(storedStructure)
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return {
    itemsRef: { current: restoredItems },
    translationsRef: { current: null as any }, // Don't persist translations in sessionStorage
    teamsRef: { 
      current: [
        { name: "Admin", logo: Logo, plan: "", href: "/admin/dashboard" },
        { name: "Кабинет Потребителя", logo: Logo, plan: "", href: "/c/dashboard" },
        { name: "Кабинет Инвестора", logo: Logo, plan: "", href: "/i/dashboard" },
        { name: "Кабинет Партнера", logo: Logo, plan: "", href: "/p/dashboard" },
      ] 
    },
    itemsStructureRef: { current: restoredItemsStructure },
    currentCollectionRef: { current: "" },
    platformLabelRef: { current: "Platform" },
    userPropsRef: { current: null as any }, // Don't persist user props
  }
}

const globalRefs = getGlobalRefs()
const globalItemsRef = globalRefs.itemsRef
const globalTranslationsRef = globalRefs.translationsRef
const globalTeamsRef = globalRefs.teamsRef
const globalItemsStructureRef = globalRefs.itemsStructureRef
const globalCurrentCollectionRef = globalRefs.currentCollectionRef
const globalPlatformLabelRef = globalRefs.platformLabelRef
const globalUserPropsRef = globalRefs.userPropsRef

// Custom comparison to prevent re-renders on state changes that don't affect sidebar
const AppSidebarComponent = function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { handleMouseDown } = useResizableSidebar()
  
  // Only subscribe to collection changes, not entire state
  const currentCollection = useAdminCollection()

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

  // Use global ref to preserve translations across component remounts
  const translationsRef = globalTranslationsRef
  const localeRef = React.useRef(locale)
  const [, setVersion] = React.useReducer(x => x + 1, 0)

  React.useEffect(() => {
    if (localeRef.current === locale && translationsRef.current) {
      return // Already loaded for this locale
    }
    
    localeRef.current = locale
    
    // Check cache first
    const cacheKey = `sidebar-translations-${locale}`
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    
    if (cached) {
      try {
        const cachedTranslations = JSON.parse(cached)
        translationsRef.current = cachedTranslations
        setVersion() // Trigger re-render once to use translations
        return
      } catch (e) {
        // If parsing fails, proceed with fetch
      }
    }

    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/locales/${locale}`)
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json() as any
        translationsRef.current = translationsData
        
        // Cache translations
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
        }
        setVersion() // Trigger re-render to use translations
      } catch (e) {
        console.error('Failed to load translations:', e)
        // Fallback: try dynamic import as backup
        try {
          const translationsModule = locale === 'ru'
            ? await import("@/packages/content/locales/ru.json")
            : await import("@/packages/content/locales/en.json")
          const translationsData = translationsModule.default || translationsModule
          translationsRef.current = translationsData
          
          // Cache fallback translations too
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
          }
          setVersion() // Trigger re-render to use translations
        } catch (fallbackError) {
          console.error('Fallback import also failed:', fallbackError)
        }
      }
    }
    
    loadTranslations()
  }, [locale])
  
  // Use stable reference from ref
  const translations = translationsRef.current

  // Helper function to convert collection name to taxonomy entity key
  const collectionToEntityKey = (collection: string): string => {
    // Special cases mapping
    const specialCases: Record<string, string> = {
      'echelon_employees': 'employee_echelon',
      'product_variants': 'product_variant',
      'asset_variants': 'asset_variant',
      'text_variants': 'text_variant',
      'wallet_transactions': 'wallet_transaction',
      'base_moves': 'base_move',
      'base_move_routes': 'base_move_route',
      'message_threads': 'message_thread',
      'outreach_referrals': 'outreach_referral',
      'echelons': 'employee_echelon',
      'employee_timesheets': 'employee_timesheet',
      'employee_leaves': 'employee_leave',
      'journal_generations': 'journal_generation',
      'journal_connections': 'journal_connection',
      'user_sessions': 'user_session',
      'user_bans': 'user_ban',
      'user_verifications': 'user_verification',
      'role_permissions': 'role_permission',
    }
    if (specialCases[collection]) {
      return specialCases[collection]
    }
    
    // Convert plural to singular (simple approach)
    // Remove trailing 's' for simple plurals, or convert common patterns
    if (collection.endsWith('ies')) {
      return collection.slice(0, -3) + 'y'
    }
    if (collection.endsWith('es') && !collection.endsWith('ses')) {
      return collection.slice(0, -2)
    }
    if (collection.endsWith('s')) {
      return collection.slice(0, -1)
    }
    return collection
  }

  // Create stable translation functions that don't change reference
  const t = React.useMemo(() => {
    if (!translations) {
      return {
        platform: "Platform",
        category: (category: string) => category,
        collection: (collection: string) => collection,
      }
    }
    const categories = translations?.sidebar?.categories || {}
    const entityOptions = translations?.taxonomy?.entityOptions || {}
    const platform = translations?.sidebar?.platform || "Platform"
    
    return {
      platform,
      category: (category: string): string => {
        return categories[category as keyof typeof categories] || category
      },
      collection: (collection: string): string => {
        const entityKey = collectionToEntityKey(collection)
        return entityOptions[entityKey as keyof typeof entityOptions] || collection
      },
    }
  }, [translations?.sidebar?.platform, translations?.sidebar?.categories, translations?.taxonomy?.entityOptions])

  const handleLocaleChange = React.useCallback((newLocale: 'en' | 'ru') => {
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-locale', newLocale)
      // Dispatch custom event to notify other components about locale change
      window.dispatchEvent(new CustomEvent('sidebar-locale-changed', { detail: newLocale }))
    }
  }, [])

  React.useEffect(() => {
    // Check if data is already loaded in sessionStorage
    const cachedGroups = typeof window !== 'undefined' ? sessionStorage.getItem('sidebar-groups') : null
    const cachedUser = typeof window !== 'undefined' ? sessionStorage.getItem('sidebar-user') : null
    
    if (cachedGroups && cachedUser) {
      try {
        setGroups(JSON.parse(cachedGroups))
        setUser(JSON.parse(cachedUser))
        setLoading(false)
      } catch (e) {
        // If parsing fails, proceed with fetch
      }
    }

    const controller = new AbortController()
    const load = async () => {
      // Only show loading if we don't have cached data
      if (!cachedGroups || !cachedUser) {
        setLoading(true)
      }
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
          
          // Cache the data
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sidebar-groups', JSON.stringify(collectionsJson.groups))
            sessionStorage.setItem('sidebar-user', JSON.stringify(meJson.user))
          }
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

  // Collections that have tables and should be shown
  const allowedCollections = ['deals']
  
  // Memoize items structure separately from active state to prevent full re-renders
  const itemsStructure = React.useMemo(() => {
    return groups.map((group) => ({
      category: group.category,
      collections: group.collections.filter((collection) => allowedCollections.includes(collection)),
      icon: categoryIcon[group.category] || SquareTerminal,
    })).filter((group) => group.collections.length > 0) // Remove groups with no collections
  }, [groups])

  // Use global refs to preserve state across component remounts
  const itemsRef = globalItemsRef
  const itemsStructureRef = globalItemsStructureRef
  const currentCollectionRef = globalCurrentCollectionRef
  const tRef = React.useRef(t)
  
  // Restore items structure to global ref if groups changed
  if (itemsStructure.length > 0 && (
    itemsStructureRef.current.length === 0 ||
    itemsStructureRef.current.length !== itemsStructure.length ||
    itemsStructureRef.current.some((s: any, i: number) => s.category !== itemsStructure[i]?.category)
  )) {
    itemsStructureRef.current = itemsStructure
  }
  
  // Initialize items on mount or when structure first appears
  // Only rebuild if structure actually changed or items are empty
  const needsRebuild = itemsRef.current.length === 0 || 
    itemsRef.current.length !== itemsStructure.length ||
    itemsRef.current.some((item: any, i: number) => item.category !== itemsStructure[i]?.category)
  
  if (needsRebuild && itemsStructure.length > 0 && translations) {
    itemsRef.current = itemsStructure.map((group) => ({
      title: t.category(group.category),
      url: "#",
      icon: group.icon,
      category: group.category,
      collections: group.collections,
      // Remove isActive - will be determined by URL in NavMainItem
      items: group.collections.map((name) => {
        const params = new URLSearchParams()
        params.set("c", name)
        params.set("p", "1")
        
        return {
          title: t.collection(name),
          url: `/admin?${params.toString()}`,
        }
      }),
    }))
    currentCollectionRef.current = currentCollection
  }
  
  // Update refs when dependencies change
  React.useEffect(() => {
    tRef.current = t
  }, [t])
  
  // Update items silently - no re-renders, just mutate in place
  React.useEffect(() => {
    const structureChanged = itemsRef.current.length !== itemsStructure.length ||
      itemsRef.current.some((item: any, i: number) => item.category !== itemsStructure[i]?.category)
    
    if (structureChanged && itemsStructure.length > 0 && translations) {
      // Rebuild items completely - but this should be rare
      itemsStructureRef.current = itemsStructure
      itemsRef.current = itemsStructure.map((group) => ({
        title: tRef.current.category(group.category),
        url: "#",
        icon: group.icon,
        category: group.category,
        collections: group.collections,
        // Remove isActive - will be determined by URL in NavMainItem
        items: group.collections.map((name) => {
          const params = new URLSearchParams()
          params.set("c", name)
          params.set("p", "1")
          
          return {
            title: tRef.current.collection(name),
            url: `/admin?${params.toString()}`,
          }
        }),
      }))
      currentCollectionRef.current = currentCollection
      
      // Persist structure to sessionStorage for dev mode hot-reloads
      // Note: We can't serialize React components (icons), so we only save structure
      try {
        if (typeof window !== 'undefined') {
          const structureToSave = itemsStructureRef.current.map((s: any) => ({
            category: s.category,
            collections: s.collections,
          }))
          sessionStorage.setItem('sidebar-global-structure', JSON.stringify(structureToSave))
        }
      } catch (e) {
        // Ignore storage errors
      }
    } else if (currentCollectionRef.current !== currentCollection && itemsRef.current.length > 0) {
      // Collection changed, but structure is static - no need to update anything
      // NavMainItem will determine active state from URL automatically
      currentCollectionRef.current = currentCollection
      // No updates needed - items are static, NavMainItem reads from URL
    }
  }, [itemsStructure, currentCollection, translations])
  
  // Always return same reference - mutations happen in-place
  const items = itemsRef.current

  // Use global ref to preserve teams across component remounts
  const teamsRef = globalTeamsRef
  
  // Update team name without causing re-renders - mutate in place
  React.useEffect(() => {
    const adminCategory = translations?.sidebar?.categories?.Admin || "Admin"
    // Mutate in place instead of recreating array
    if (teamsRef.current[0] && teamsRef.current[0].name !== adminCategory) {
      teamsRef.current[0].name = adminCategory
    }
  }, [translations?.sidebar?.categories?.Admin])
  
  // Always return same reference - mutations happen in-place
  const teams = teamsRef.current

  // Use global ref for userProps to maintain stable reference
  const userPropsRef = globalUserPropsRef
  React.useEffect(() => {
    if (user) {
      const newProps = {
        name: user.name,
        email: user.email,
        avatar: "/avatars/placeholder-user.jpg",
      }
      // Only update if changed
      if (!userPropsRef.current || 
          userPropsRef.current.name !== newProps.name ||
          userPropsRef.current.email !== newProps.email) {
        userPropsRef.current = newProps
      }
    } else {
      userPropsRef.current = null
    }
  }, [user?.name, user?.email])
  const userProps = userPropsRef.current

  // Use global ref for platformLabel to maintain stable reference
  const platformLabelRef = globalPlatformLabelRef
  React.useEffect(() => {
    const newLabel = translations?.sidebar?.platform || "Platform"
    if (platformLabelRef.current !== newLabel) {
      platformLabelRef.current = newLabel
    }
  }, [translations?.sidebar?.platform])
  const platformLabel = platformLabelRef.current
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherMemo teams={teams as any} translations={translations} />
      </SidebarHeader>
      <SidebarContent>
        {loading && (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="px-3 py-2 text-xs text-destructive">{error}</div>
        )}
        {!loading && !error && <NavMainMemo items={items} platformLabel={platformLabel} currentCollection={currentCollection} />}
      </SidebarContent>
      <SidebarFooter>
        {userProps && (
          <NavUserMemo 
            user={userProps}
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

export const AppSidebar = React.memo(AppSidebarComponent, (prevProps, nextProps) => {
  // Always allow re-renders - React.memo will prevent if props are the same
  // The actual optimization happens inside the component with global refs
  return false // Allow re-render (React.memo default behavior)
})
