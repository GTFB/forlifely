"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  Globe,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "@/packages/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export const NavUser = React.memo(function NavUser({
  user,
  locale,
  onLocaleChange,
  translations,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  locale?: 'en' | 'ru'
  onLocaleChange?: (locale: 'en' | 'ru') => void
  translations?: any
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const t = translations?.navUser || {
    notifications: "Notifications",
    english: "English",
    russian: "Russian",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    logOut: "Log out",
  }

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light", false)
  }, [theme, setTheme])

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (e) {
      router.push("/")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Bell />
                {t.notifications}
              </DropdownMenuItem>
              {onLocaleChange && (
                <>
                  <DropdownMenuItem onClick={() => onLocaleChange(locale === 'ru' ? 'en' : 'ru')}>
                    <Globe />
                    {locale === 'ru' ? t.english : t.russian} ({locale?.toUpperCase()})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "light" ? <Moon /> : <Sun />}
                {theme === "light" ? t.darkMode : t.lightMode}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              {t.logOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if props actually changed
  if (
    prevProps.user.name !== nextProps.user.name ||
    prevProps.user.email !== nextProps.user.email ||
    prevProps.user.avatar !== nextProps.user.avatar ||
    prevProps.locale !== nextProps.locale
  ) {
    return false // Re-render needed
  }
  
  // For translations, compare by reference (they should be stable)
  if (prevProps.translations !== nextProps.translations) {
    // If translations changed, check if navUser section is actually different
    const prevNavUser = prevProps.translations?.navUser
    const nextNavUser = nextProps.translations?.navUser
    if (prevNavUser !== nextNavUser && JSON.stringify(prevNavUser) !== JSON.stringify(nextNavUser)) {
      return false // Re-render needed
    }
  }
  
  return true // Skip re-render
})
