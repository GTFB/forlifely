"use client"

import * as React from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAdminCollection } from "@/components/admin/AdminStateProvider"
import { getCollection } from "@/shared/collections/getCollection"
interface AdminHeaderProps {
  title?: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
}

export const AdminHeader = React.memo(function AdminHeader({ 
  title,
  breadcrumbItems 
}: AdminHeaderProps) {
  // Only subscribe to collection, not entire state
  const currentCollection = useAdminCollection()
  const [locale, setLocale] = React.useState<'en' | 'ru'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved === 'en' || saved === 'ru') {
        return saved
      }
    }
    return 'ru'
  })
  const [displayTitle, setDisplayTitle] = React.useState<string>(title || '')
  const prevCollectionRef = React.useRef<string | null>(null)
  const displayTitleRef = React.useRef<string>(title || '')
  const [translations, setTranslations] = React.useState<any>(null)

  // Sync locale with sidebar when it changes
  React.useEffect(() => {
    const handleLocaleChanged = (e: StorageEvent | CustomEvent) => {
      const newLocale = (e as CustomEvent).detail || (e as StorageEvent).newValue
      if (newLocale === 'en' || newLocale === 'ru') {
        setLocale(newLocale)
      }
    }

    // Listen to localStorage changes
    window.addEventListener('storage', handleLocaleChanged as EventListener)
    // Listen to custom event from sidebar
    window.addEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)

    return () => {
      window.removeEventListener('storage', handleLocaleChanged as EventListener)
      window.removeEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)
    }
  }, [])

  // Load translations
  React.useEffect(() => {
    const loadTranslations = async () => {
      try {
        const cacheKey = `sidebar-translations-${locale}`
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
        
        if (cached) {
          try {
            const cachedTranslations = JSON.parse(cached) as { dataTable?: { adminPanel?: string }; taxonomy?: { entityOptions?: Record<string, string> } }
            setTranslations(cachedTranslations)
            // Continue to fetch fresh translations in background to ensure we have latest
            // Don't return here, let it fetch fresh data
          } catch (e) {
            console.error('[AdminHeader] Failed to parse cached translations:', e)
            // If parsing fails, proceed with fetch
          }
        }
        
        const response = await fetch(`/api/locales/${locale}`)
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json() as { dataTable?: { adminPanel?: string }; taxonomy?: { entityOptions?: Record<string, string> } }
        setTranslations(translationsData)
        
        // Cache translations
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
        }
      } catch (e) {
        console.error('[AdminHeader] Failed to load translations:', e)
        // Fallback to direct import
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

  const adminPanelLabel = React.useMemo(() => {
    const label = translations?.dataTable?.adminPanel || "Admin Panel"
    return label
  }, [translations?.dataTable?.adminPanel])

  React.useEffect(() => {
    if (title) {
      displayTitleRef.current = title
      setDisplayTitle(title)
      prevCollectionRef.current = null
      return
    }

    // Only update if collection actually changed
    if (prevCollectionRef.current === currentCollection) {
      return
    }
    prevCollectionRef.current = currentCollection

    // Get collection config to check for __title
    const collection = getCollection(currentCollection)
    const titleConfig = (collection as any).__title
    
    // Helper function to convert collection name to taxonomy entity key
    const collectionToEntityKey = (collection: string): string => {
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
      if (specialCases[collection]) return specialCases[collection]
      if (collection.endsWith('ies')) return collection.slice(0, -3) + 'y'
      if (collection.endsWith('es') && !collection.endsWith('ses')) return collection.slice(0, -2)
      if (collection.endsWith('s')) return collection.slice(0, -1)
      return collection
    }
    
    // Try to get translated collection name from taxonomy.entityOptions
    let collectionTitle: string
    if (translations?.taxonomy?.entityOptions) {
      const entityKey = collectionToEntityKey(currentCollection)
      const entityOptions = translations.taxonomy.entityOptions as Record<string, string>
      collectionTitle = entityOptions[entityKey] || currentCollection.charAt(0).toUpperCase() + currentCollection.slice(1)
    } else {
      // Use __title if available, otherwise use collection name
      const collectionName = currentCollection.charAt(0).toUpperCase() + currentCollection.slice(1)
      collectionTitle = collectionName
      
      // Check if __title is a string or BaseColumn
      if (typeof titleConfig === 'string') {
        collectionTitle = titleConfig
      } else if (titleConfig?.options?.defaultValue) {
        collectionTitle = titleConfig.options.defaultValue
      }
    }
    
    displayTitleRef.current = collectionTitle
    setDisplayTitle(collectionTitle)
    
    // Update document title
    const panelLabel = translations?.dataTable?.adminPanel || "Admin Panel"
    const newTitle = `${collectionTitle} - ${panelLabel}`
    document.title = newTitle
    
    // Set again after a short delay to override Next.js metadata
    const timeouts = [
      setTimeout(() => { document.title = newTitle }, 0),
      setTimeout(() => { document.title = newTitle }, 10),
      setTimeout(() => { document.title = newTitle }, 100),
    ]
    
    return () => {
      timeouts.forEach(t => clearTimeout(t))
    }
  }, [currentCollection, title, translations?.taxonomy?.entityOptions, translations?.dataTable?.adminPanel])

  // Use ref for breadcrumb items to prevent re-creation
  const finalBreadcrumbItemsRef = React.useRef<Array<{ label: string; href?: string }>>(
    breadcrumbItems || [
      { label: "Admin Panel", href: "#" },
      { label: displayTitleRef.current || currentCollection },
    ]
  )
  
  React.useEffect(() => {
    if (breadcrumbItems) {
      finalBreadcrumbItemsRef.current = breadcrumbItems
    } else {
      // Use displayTitle state instead of ref for breadcrumbs
      const collectionToEntityKey = (collection: string): string => {
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
        if (specialCases[collection]) return specialCases[collection]
        if (collection.endsWith('ies')) return collection.slice(0, -3) + 'y'
        if (collection.endsWith('es') && !collection.endsWith('ses')) return collection.slice(0, -2)
        if (collection.endsWith('s')) return collection.slice(0, -1)
        return collection
      }
      const entityKey = collectionToEntityKey(currentCollection)
      const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
      const collectionLabel = displayTitle || entityOptions[entityKey] || currentCollection
      finalBreadcrumbItemsRef.current = [
        { label: adminPanelLabel, href: "#" },
        { label: collectionLabel },
      ]
    }
  }, [breadcrumbItems, displayTitle, currentCollection, adminPanelLabel, translations?.taxonomy?.entityOptions])
  
  const finalBreadcrumbItems = finalBreadcrumbItemsRef.current

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {finalBreadcrumbItems.map((item, index) => {
            const isLast = index === finalBreadcrumbItems.length - 1
            return (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index > 0 ? "hidden md:block" : ""}>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild><Link href={item.href || "#"}>{item.label}</Link></BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}, (prevProps, nextProps) => {
  // Only re-render if title or breadcrumbItems actually changed
  if (prevProps.title !== nextProps.title) {
    return false
  }
  
  if (prevProps.breadcrumbItems?.length !== nextProps.breadcrumbItems?.length) {
    return false
  }
  
  if (prevProps.breadcrumbItems && nextProps.breadcrumbItems) {
    for (let i = 0; i < prevProps.breadcrumbItems.length; i++) {
      if (
        prevProps.breadcrumbItems[i].label !== nextProps.breadcrumbItems[i].label ||
        prevProps.breadcrumbItems[i].href !== nextProps.breadcrumbItems[i].href
      ) {
        return false
      }
    }
  }
  
  return true // Skip re-render
})

