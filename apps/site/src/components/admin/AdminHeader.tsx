"use client"

import * as React from "react"
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
  const [displayTitle, setDisplayTitle] = React.useState<string>(title || '')
  const prevCollectionRef = React.useRef<string | null>(null)
  const displayTitleRef = React.useRef<string>(title || '')

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
    
    // Use __title if available, otherwise use collection name
    const collectionName = currentCollection.charAt(0).toUpperCase() + currentCollection.slice(1)
    let collectionTitle = collectionName
    
    // Check if __title is a string or BaseColumn
    if (typeof titleConfig === 'string') {
      collectionTitle = titleConfig
    } else if (titleConfig?.options?.defaultValue) {
      collectionTitle = titleConfig.options.defaultValue
    }
    
    displayTitleRef.current = collectionTitle
    setDisplayTitle(collectionTitle)
    
    // Update document title
    const newTitle = `${collectionTitle} - Admin Panel`
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
  }, [currentCollection, title])

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
      finalBreadcrumbItemsRef.current = [
        { label: "Admin Panel", href: "#" },
        { label: displayTitleRef.current || currentCollection },
      ]
    }
  }, [breadcrumbItems, displayTitle, currentCollection])
  
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
                    <BreadcrumbLink href={item.href || "#"}>{item.label}</BreadcrumbLink>
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

