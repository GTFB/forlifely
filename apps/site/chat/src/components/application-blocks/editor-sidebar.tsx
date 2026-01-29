"use client"

import * as React from "react"
import {
  BookOpen,
  Settings2,
  SquareTerminal,
  ShoppingCart,
  Database,
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

type MeResponse = {
  user?: { id: string; email: string; name: string; role: string }
  error?: string
}

export function EditorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { handleMouseDown } = useResizableSidebar()
  const { state } = useAdminState()

  const [user, setUser] = React.useState<MeResponse["user"] | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const load = async () => {
      setLoading(true)
      try {
        const meRes = await fetch("/api/auth/me", { 
          credentials: "include", 
          signal: controller.signal 
        })
        
        if (!isMounted) return
        
        if (meRes.ok) {
          const meJson: MeResponse = await meRes.json()
          if (meJson.user && isMounted) setUser(meJson.user)
        }
      } catch (e) {
        if (isMounted && (e as any)?.name !== "AbortError") {
          console.error("Failed to load user data:", e)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    load().catch((e) => {
      if (e?.name !== "AbortError" && isMounted) {
        console.error("Failed to load sidebar data:", e)
      }
    })
    
    return () => {
      isMounted = false
    }
  }, [])

  const items = React.useMemo(() => {
    // Editor has access to only 5 menu items
    return [
      {
        title: "Товары",
        url: "/editor?c=products&p=1&ps=20",
        icon: SquareTerminal,
        isActive: state.collection === "products",
      },
      {
        title: "Заказы",
        url: "/editor?c=deals&p=1&ps=20",
        icon: ShoppingCart,
        isActive: state.collection === "deals",
      },
      {
        title: "Контент",
        url: "/editor?c=texts&p=1&ps=20",
        icon: BookOpen,
        isActive: state.collection === "texts",
      },
      {
        title: "Справочники",
        url: "/editor?c=taxonomy&p=1&ps=20",
        icon: Database,
        isActive: state.collection === "taxonomy",
      },
      {
        title: "Настройки",
        url: "/editor?c=settings&p=1&ps=20",
        icon: Settings2,
        isActive: state.collection === "settings",
      },
    ]
  }, [state.collection])

  // Dummy teams source for TeamSwitcher
  const teams = [{ name: "Редактор", logo: BookOpen, plan: "" }]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams as any} />
      </SidebarHeader>
      <SidebarContent>
        {loading && (
          <div className="px-3 py-2 text-xs text-muted-foreground">Загрузка...</div>
        )}
        {!loading && <NavMain items={items} />}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={{ name: user.name, email: user.email, avatar: "/avatars/placeholder-user.jpg" }} />}
      </SidebarFooter>
      <SidebarRail onMouseDown={handleMouseDown} />
    </Sidebar>
  )
}

