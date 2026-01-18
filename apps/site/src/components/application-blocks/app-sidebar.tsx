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
  Terminal,
} from "lucide-react"
import { Logo } from "@/components/misc/logo/logo"
import { PROJECT_SETTINGS, LANGUAGES } from "@/settings"
import { usePathname } from "next/navigation"

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
import { useMe } from "@/providers/MeProvider"

type CollectionsResponse = {
  success: boolean
  total: number
  groups: { category: string; collections: string[] }[]
}

type MeResponse = {
  user?: { id: string; email: string; name: string; role: string; avatarUrl?: string | null }
  error?: string
}

function toFirstLastName(fullName: string): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(" ")
  return parts.slice(0, 2).join(" ")
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
  const pathname = usePathname()
  
  // Only subscribe to collection changes, not entire state
  const currentCollection = useAdminCollection()

  const [groups, setGroups] = React.useState<CollectionsResponse["groups"]>([])
  const [user, setUser] = React.useState<MeResponse["user"] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  type LanguageCode = (typeof LANGUAGES)[number]['code']
  const supportedLanguageCodes = LANGUAGES.map(lang => lang.code)
  
  const [locale, setLocale] = React.useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved && supportedLanguageCodes.includes(saved as LanguageCode)) {
        return saved as LanguageCode
      }
    }
    // Use PROJECT_SETTINGS.defaultLanguage, but ensure it's in LANGUAGES
    const defaultLang = PROJECT_SETTINGS.defaultLanguage
    if (supportedLanguageCodes.includes(defaultLang as LanguageCode)) {
      return defaultLang as LanguageCode
    }
    // Fallback to first available language
    return LANGUAGES[0]?.code || 'en'
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
        // Use cached immediately, but still fetch fresh in background (important for newly added locales like rs)
        setVersion()
      } catch (e) {
        // If parsing fails, proceed with fetch
      }
    }

    let isMounted = true

    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/locales/${locale}`)
        if (!isMounted) return
        
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json() as any
        
        if (!isMounted) return
        
        translationsRef.current = translationsData
        
        // Cache translations
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
        }
        setVersion() // Trigger re-render to use translations
      } catch (e) {
        if (!isMounted) return
        
        console.error('Failed to load translations:', e)
        // Fallback: try dynamic import as backup
        try {
          const translationsModule = locale === 'ru'
            ? await import("@/packages/content/locales/ru.json")
            : await import("@/packages/content/locales/en.json")
          const translationsData = translationsModule.default || translationsModule
          
          if (!isMounted) return
          
          translationsRef.current = translationsData
          
          // Cache fallback translations too
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
          }
          setVersion() // Trigger re-render to use translations
        } catch (fallbackError) {
          if (!isMounted) return
          console.error('Fallback import also failed:', fallbackError)
        }
      }
    }

    void loadTranslations()
    
    return () => {
      isMounted = false
    }
  }, [locale])
  
  // Use stable reference from ref
  const translations = translationsRef.current

  // Helper function to convert collection name to taxonomy entity key
  const collectionToEntityKey = (collection: string): string => {
    // Special cases mapping
    const specialCases: Record<string, string> = {
      'roles': 'role',
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
  // Include locale in dependencies to ensure translations update when locale changes
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
  }, [locale, translations?.sidebar?.platform, translations?.sidebar?.categories, translations?.taxonomy?.entityOptions])

  const handleLocaleChange = React.useCallback((newLocale: LanguageCode) => {
    // Validate that the locale is in supported languages
    if (!supportedLanguageCodes.includes(newLocale)) {
      console.warn(`Locale ${newLocale} is not in supported languages`)
      return
    }
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-locale', newLocale)
      // Dispatch custom event to notify other components about locale change
      window.dispatchEvent(new CustomEvent('sidebar-locale-changed', { detail: newLocale }))
    }
  }, [supportedLanguageCodes])

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

    let isMounted = true
    
    const load = async () => {
      // Only show loading if we don't have cached data
      if (!cachedGroups || !cachedUser) {
        if (isMounted) {
          setLoading(true)
        }
      }
      if (isMounted) {
        setError(null)
      }
      
      try {
        const [collectionsRes, meRes] = await Promise.all([
          fetch("/api/admin/collections", { credentials: "include" }),
          fetch("/api/auth/me", { credentials: "include" }),
        ])

        if (!isMounted) return
        
        if (!collectionsRes.ok) throw new Error(`Collections failed: ${collectionsRes.status}`)
        const collectionsJson: CollectionsResponse = await collectionsRes.json()
        
        if (!isMounted) return
        
        setGroups(collectionsJson.groups)

        if (meRes.ok) {
          const meJson: MeResponse = await meRes.json()
          if (meJson.user && isMounted) {
            setUser(meJson.user)
            
            // Cache the data
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('sidebar-groups', JSON.stringify(collectionsJson.groups))
              sessionStorage.setItem('sidebar-user', JSON.stringify(meJson.user))
            }
          }
        }
      } catch (e) {
        if (isMounted) {
          setError((e as Error).message)
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    void load()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Allow profile page to push updated user fields (e.g., avatar) without full reload
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<NonNullable<MeResponse["user"]>> | undefined
      if (!detail) return
      setUser((prev) => (prev ? ({ ...prev, ...detail } as any) : (detail as any)))
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("sidebar-user")
          if (cached) {
            const parsed = JSON.parse(cached)
            sessionStorage.setItem("sidebar-user", JSON.stringify({ ...parsed, ...detail }))
          }
        }
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("sidebar-user-updated", handler as EventListener)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sidebar-user-updated", handler as EventListener)
      }
    }
  }, [])

  // Memoize items structure separately from active state to prevent full re-renders
  const itemsStructure = React.useMemo(() => {
    return groups.map((group) => ({
      category: group.category,
      collections: group.collections, // Show all collections
      icon: categoryIcon[group.category] || SquareTerminal,
    })).filter((group) => group.collections.length > 0) // Remove groups with no collections
  }, [groups])

  // Use global refs to preserve state across component remounts
  const itemsRef = globalItemsRef
  const itemsStructureRef = globalItemsStructureRef
  const currentCollectionRef = globalCurrentCollectionRef
  const tRef = React.useRef(t)
  const localeRefForItems = React.useRef(locale)
  
  // Restore items structure to global ref if groups changed
  if (itemsStructure.length > 0 && (
    itemsStructureRef.current.length === 0 ||
    itemsStructureRef.current.length !== itemsStructure.length ||
    itemsStructureRef.current.some((s: any, i: number) => s.category !== itemsStructure[i]?.category)
  )) {
    itemsStructureRef.current = itemsStructure
  }
  
  // Initialize items on mount or when structure/translations change
  // Rebuild if structure changed, items are empty, locale changed, or translations changed
  const needsRebuild = itemsRef.current.length === 0 || 
    itemsRef.current.length !== itemsStructure.length ||
    itemsRef.current.some((item: any, i: number) => item.category !== itemsStructure[i]?.category) ||
    localeRefForItems.current !== locale || // Rebuild when locale changes
    tRef.current !== t // Rebuild when translation functions change
  
  if (needsRebuild && itemsStructure.length > 0 && translations) {
    localeRefForItems.current = locale // Update locale ref
    tRef.current = t // Update translation functions ref
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
    
    // Check if locale or translations changed
    const localeChanged = localeRefForItems.current !== locale
    const translationsChanged = tRef.current !== t
    
    if ((structureChanged || localeChanged || translationsChanged) && itemsStructure.length > 0 && translations) {
      // Rebuild items completely when structure, locale, or translations change
      localeRefForItems.current = locale
      tRef.current = t
      itemsStructureRef.current = itemsStructure
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
  }, [itemsStructure, currentCollection, translations, locale, t])
  
  // Use state to trigger re-renders when items change due to locale/translations
  const [itemsState, setItemsState] = React.useState(itemsRef.current)
  
  // Update state when itemsRef changes (due to locale/translations change)
  React.useEffect(() => {
    if (itemsRef.current.length > 0) {
      setItemsState(itemsRef.current)
    }
  }, [locale, translations?.sidebar?.platform, translations?.sidebar?.categories, translations?.taxonomy?.entityOptions])
  
  // Always return same reference - mutations happen in-place
  let items = itemsState.length > 0 ? itemsState : itemsRef.current

  // Use global ref to preserve teams across component remounts
  const teamsRef = globalTeamsRef
  
  // Get user roles from useMe hook
  const { user: meUser } = useMe()
  
  // Add System section with SQL Editor for super admins
  const isSuperAdmin = meUser?.roles?.some((r) => r.name === 'Administrator') || false
  const finalItems = React.useMemo(() => {
    if (!isSuperAdmin) return items
    
    // Check if System section already exists
    const hasSystemSection = items.some((item: any) => item.category === 'System')
    if (hasSystemSection) return items
    
    const sqlEditorTitle = translations?.sidebar?.menuItems?.SqlEditor || 'SQL Editor'
    const seedTitle = translations?.sidebar?.menuItems?.Seed || 'Seed'
    const settingsTitle = translations?.sidebar?.menuItems?.Settings || 'Settings'

    // Add System section at the end
    return [
      ...items,
      {
        title: translations?.sidebar?.categories?.System || 'Система',
        url: '#',
        icon: Settings2,
        category: 'System',
        collections: [],
        items: [
          {
            title: sqlEditorTitle,
            url: '/admin/sql-editor',
          },
          {
            title: seedTitle,
            url: '/admin/seed',
          },
          {
            title: settingsTitle,
            url: '/admin/settings',
          },
        ],
      },
    ]
  }, [
    items,
    isSuperAdmin,
    translations?.sidebar?.categories?.System,
    translations?.sidebar?.menuItems?.SqlEditor,
    translations?.sidebar?.menuItems?.Seed,
    translations?.sidebar?.menuItems?.Settings,
  ])
  
  items = finalItems
  
  // Load roles from Roles collection
  const [rolesLoading, setRolesLoading] = React.useState(false)
  
  const loadRoles = React.useCallback(async () => {
    setRolesLoading(true)
    try {
      const res = await fetch('/api/admin/state?c=roles&ps=1000', {
        credentials: 'include'
      })
      if (!res.ok) {
        throw new Error(`Failed to load roles: ${res.status}`)
      }
      const json = await res.json() as { success?: boolean; data?: any[] }
      
      if (!json.success || !json.data) {
        return
      }
      
      // Transform roles to teams format
      const roleTeams: Array<{
        name: string
        logo: React.ElementType
        plan: string
        href: string
        order: number
      }> = []
      
      json.data.forEach((role: any) => {
        // Extract title for current locale
        let roleName = ''
        if (role.title) {
          const title = typeof role.title === 'string' 
            ? JSON.parse(role.title) 
            : role.title
          roleName = title[locale] || title.en || title.ru || title.rs || role.name || ''
        } else {
          roleName = role.name || ''
        }
        
        // Extract suffix from data_in
        let href = ''
        if (role.data_in) {
          let dataIn: any
          try {
            dataIn = typeof role.data_in === 'string' 
              ? JSON.parse(role.data_in) 
              : role.data_in
          } catch {
            // Ignore parse errors
          }
          
          if (dataIn?.suffix) {
            const suffix = dataIn.suffix[locale] || dataIn.suffix.en || dataIn.suffix.ru || dataIn.suffix.rs
            if (suffix) {
              href = typeof suffix === 'object' && 'value' in suffix 
                ? suffix.value 
                : String(suffix)
            }
          }
        }
        
        // Skip if no href (suffix not found)
        if (!href) {
          return
        }
        
        // Try to get order from role.order or data_in.order
        const order = role.order !== undefined ? Number(role.order) : 
          (role.data_in && typeof role.data_in === 'object' && 'order' in role.data_in 
            ? Number(role.data_in.order) 
            : 0)
        
        roleTeams.push({
          name: roleName,
          logo: Logo,
          plan: role.description || '',
          href: href,
          order,
        })
      })
      
      // Sort by order
      roleTeams.sort((a, b) => a.order - b.order)
      
      // Update teamsRef if changed
      const currentTeamsStr = JSON.stringify(teamsRef.current)
      const newTeamsStr = JSON.stringify(roleTeams)
      if (currentTeamsStr !== newTeamsStr) {
        teamsRef.current = roleTeams as any
      }
    } catch (e) {
      console.error('Failed to load roles:', e)
    } finally {
      setRolesLoading(false)
    }
  }, [locale])
  
  // Load roles on mount and when locale changes
  React.useEffect(() => {
    void loadRoles()
  }, [loadRoles])
  
  // Always return same reference - mutations happen in-place
  const teams = teamsRef.current

  // Use global ref for userProps to maintain stable reference
  const userPropsRef = globalUserPropsRef
  React.useEffect(() => {
    if (user) {
      const newProps = {
        name: toFirstLastName(user.name),
        email: user.email,
        avatar: (user as any).avatarUrl || "/avatars/placeholder-user.jpg",
      }
      // Only update if changed
      if (!userPropsRef.current || 
          userPropsRef.current.name !== newProps.name ||
          userPropsRef.current.email !== newProps.email ||
          userPropsRef.current.avatar !== newProps.avatar) {
        userPropsRef.current = newProps
      }
    } else {
      userPropsRef.current = null
    }
  }, [user?.name, user?.email, (user as any)?.avatarUrl])
  const userProps = userPropsRef.current

  // Compute active role name based on pathname and teams
  const activeRoleName = React.useMemo(() => {
    const teams = teamsRef.current
    if (!pathname || !teams || teams.length === 0) {
      return translations?.sidebar?.platform || "Platform"
    }
    
    // Find active team based on pathname - check if pathname starts with any team's href
    let activeTeam = teams.find(t => {
      if (!t.href) return false
      // Exact match or pathname starts with href
      return pathname === t.href || pathname.startsWith(t.href + '/')
    })
    
    // Fallback to prefix-based matching for backward compatibility
    if (!activeTeam) {
      if (pathname.startsWith('/admin')) {
        activeTeam = teams.find(t => t.href === '/admin/dashboard' || t.href?.startsWith('/admin'))
      } else if (pathname.startsWith('/m/')) {
        activeTeam = teams.find(t => t.href?.startsWith('/m/'))
      } else if (pathname.startsWith('/c/')) {
        activeTeam = teams.find(t => t.href?.startsWith('/c/'))
      } else if (pathname.startsWith('/i/')) {
        activeTeam = teams.find(t => t.href?.startsWith('/i/'))
      } else if (pathname.startsWith('/p/')) {
        activeTeam = teams.find(t => t.href?.startsWith('/p/'))
      }
    }
    
    return activeTeam?.name || teams[0]?.name || translations?.sidebar?.platform || "Platform"
  }, [pathname, translations?.sidebar?.platform])

  // Use global ref for platformLabel to maintain stable reference
  const platformLabelRef = globalPlatformLabelRef
  React.useEffect(() => {
    if (platformLabelRef.current !== activeRoleName) {
      platformLabelRef.current = activeRoleName
    }
  }, [activeRoleName])
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

