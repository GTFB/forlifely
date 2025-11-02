"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export const NavMain = React.memo(function NavMain({
  items,
  platformLabel = "Platform",
  currentCollection = "",
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    collections?: string[]
    items?: {
      title: string
      url: string
      onClick?: () => void
    }[]
  }[]
  platformLabel?: string
  currentCollection?: string
}) {
  // Track open state for each collapsible - use ref to persist across re-renders
  const openStatesRef = React.useRef<Record<string, boolean>>({})
  
  // Initialize open states - check if current collection is in any category
  if (Object.keys(openStatesRef.current).length === 0 && currentCollection) {
    items.forEach((item: any) => {
      if (item.collections?.includes(currentCollection)) {
        openStatesRef.current[item.title] = true
      }
    })
  }

  const handleOpenChange = React.useCallback((title: string, open: boolean) => {
    openStatesRef.current[title] = open
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{platformLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Determine if any sub-item is active by checking if currentCollection is in this category
          const isCategoryActive = (item as any).collections?.includes(currentCollection) ?? false
          return (
            <NavMainItem
              key={item.title}
              item={item}
              currentCollection={currentCollection}
              initialOpen={openStatesRef.current[item.title] ?? isCategoryActive}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}, (prevProps, nextProps) => {
  // Allow re-render if currentCollection changed (to update active state in NavMainItem)
  // But structure (items) should be static, so React will efficiently update only active classes
  if (prevProps.platformLabel !== nextProps.platformLabel) {
    return false // Re-render needed
  }
  
  // If items array reference is the same AND currentCollection unchanged, skip re-render
  if (prevProps.items === nextProps.items && prevProps.currentCollection === nextProps.currentCollection) {
    return true // Same reference and collection, skip re-render
  }
  
  if (prevProps.items.length !== nextProps.items.length) {
    return false // Re-render needed - structure changed
  }
  
  // Deep comparison of items structure
  for (let i = 0; i < prevProps.items.length; i++) {
    const prev = prevProps.items[i]
    const next = nextProps.items[i]
    
    // Check structure changes
    if (
      prev.title !== next.title ||
      prev.url !== next.url ||
      prev.items?.length !== next.items?.length
    ) {
      return false // Re-render needed - structure changed
    }
    
    // Compare sub-items if they exist
    if (prev.items && next.items) {
      for (let j = 0; j < prev.items.length; j++) {
        if (
          prev.items[j].title !== next.items[j].title ||
          prev.items[j].url !== next.items[j].url
        ) {
          return false // Re-render needed - sub-items changed
        }
      }
    }
  }
  
  // Structure is the same, but currentCollection might have changed
  // Allow re-render to update active state (React will efficiently update only CSS classes)
  return false
})

// Separate component for each collapsible item to preserve state
// Use controlled state internally to prevent re-renders
const NavMainItem = React.memo(function NavMainItem({
  item,
  currentCollection,
  initialOpen,
  onOpenChange,
}: {
  item: {
    title: string
    url: string
    icon?: LucideIcon
    collections?: string[]
    items?: {
      title: string
      url: string
      onClick?: () => void
    }[]
  }
  currentCollection: string
  initialOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  // Determine active state from collection prop - simple comparison, no hooks
  const isCategoryActive = item.collections?.includes(currentCollection) ?? false
  
  // Internal state that persists across parent re-renders
  const [internalOpen, setInternalOpen] = React.useState(initialOpen)
  const prevIsActiveRef = React.useRef(isCategoryActive)
  
  // Auto-open category if it becomes active (but don't close if user manually closed)
  React.useEffect(() => {
    if (!prevIsActiveRef.current && isCategoryActive) {
      // Category became active - auto-open it
      setInternalOpen(true)
    }
    prevIsActiveRef.current = isCategoryActive
  }, [isCategoryActive])
  
  const handleOpenChange = React.useCallback((open: boolean) => {
    setInternalOpen(open)
    onOpenChange(open)
  }, [onOpenChange])
  
  // When collapsed, use DropdownMenu instead of Collapsible
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isCategoryActive}>
              {item.icon && <item.icon />}
              {!isCollapsed && <span>{item.title}</span>}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-56"
            sideOffset={8}
          >
            {item.items?.map((subItem) => {
              // Determine if sub-item is active by parsing its URL
              const subItemParams = new URLSearchParams(subItem.url.split('?')[1] || '')
              const subItemCollection = subItemParams.get('c') || ''
              const isSubItemActive = subItemCollection === currentCollection
              
              return (
                <DropdownMenuItem key={subItem.title} asChild>
                  <a
                    href={subItem.url}
                    className={isSubItemActive ? "bg-accent" : ""}
                    onClick={(e) => {
                      if (subItem.onClick) {
                        e.preventDefault()
                        subItem.onClick()
                      }
                    }}
                  >
                    <span>{subItem.title}</span>
                  </a>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }
  
  // When expanded, use Collapsible as before
  return (
    <Collapsible
      asChild
      open={internalOpen}
      onOpenChange={handleOpenChange}
      className="group/collapsible"
    >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} isActive={isCategoryActive}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
    </Collapsible>
  )
}, (prevProps, nextProps) => {
  // Only re-render if structure changed OR currentCollection changed (for active state)
  // We allow re-render when currentCollection changes to update active CSS classes
  // This is fine - React will efficiently update only the changed DOM nodes
  if (prevProps.item.title !== nextProps.item.title) {
    return false
  }
  if (prevProps.item.url !== nextProps.item.url) {
    return false
  }
  if (prevProps.item.items?.length !== nextProps.item.items?.length) {
    return false
  }
  
  // Check sub-items structure
  if (prevProps.item.items && nextProps.item.items) {
    for (let i = 0; i < prevProps.item.items.length; i++) {
      if (prevProps.item.items[i].title !== nextProps.item.items[i].title) {
        return false
      }
      if (prevProps.item.items[i].url !== nextProps.item.items[i].url) {
        return false
      }
    }
  }
  
  // If item reference is the same AND currentCollection hasn't changed, skip re-render
  // Otherwise allow re-render to update active state (but structure is unchanged, so React optimizes DOM updates)
  if (prevProps.item === nextProps.item && prevProps.currentCollection === nextProps.currentCollection) {
    return true // Structure and collection unchanged - skip re-render
  }
  
  return false // Allow re-render - currentCollection changed (to update active state) or structure changed
})
