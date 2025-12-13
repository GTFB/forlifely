'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  FileQuestion,
  MessageSquare,
  CheckSquare,
  Database,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMe } from '@/providers/MeProvider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Logo } from '@/components/misc/logo/logo'
import { useResizableSidebar } from '@/packages/hooks/use-resizable-sidebar'
import { useTheme } from '@/packages/hooks/use-theme'
import { User, Sun, Moon } from 'lucide-react'

export interface NavigationItem {
  title: string
  url: string
  icon: LucideIcon
}

interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Операции',
    items: [
      {
        title: 'Общая сводка',
        url: '/admin/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Заявки',
        url: '/admin/deals',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Пользователи',
    items: [
      {
        title: 'Пользователи',
        url: '/admin/users',
        icon: Users,
      },
    ],
  },
  // Временно скрыто
  {
    title: 'Контент',
    items: [
      {
        title: 'Блог',
        url: '/admin/content/blog',
        icon: BookOpen,
      },
      // {
      //   title: 'Страницы',
      //   url: '/admin/content/pages',
      //   icon: FileText,
      // },
      // {
      //   title: 'FAQ',
      //   url: '/admin/content/faq',
      //   icon: FileQuestion,
      // },
    ],
  },
  {
    title: 'Поддержка',
    items: [
      {
        title: 'Поддержка',
        url: '/admin/support',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Задачи',
    items: [
      {
        title: 'Менеджер задач',
        url: '/admin/tasks',
        icon: CheckSquare,
      },
    ],
  },
]

interface AdminSidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const { handleMouseDown } = useResizableSidebar()
  const { theme, setTheme } = useTheme()
  const { user: meUser } = useMe()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const isActive = (url: string) => {
    if (url.includes('?')) {
      const [baseUrl] = url.split('?')
      return pathname === baseUrl || pathname?.startsWith(baseUrl + '/')
    }
    return pathname === url || pathname?.startsWith(url + '/')
  }

  // Check if user is super admin (has Administrator role)
  const isSuperAdmin = meUser?.roles?.some((role) => role.name === 'Administrator') || false

  // Build navigation groups dynamically based on user role
  const getNavigationGroups = (): NavigationGroup[] => {
    const groups: NavigationGroup[] = [...navigationGroups]

    // Add system links for super admin only
    if (isSuperAdmin) {
      groups.push({
        title: 'Система',
        items: [
          {
            title: 'Настройки',
            url: '/admin/settings',
            icon: Settings,
          },
          {
            title: 'Seed',
            url: '/admin/seed',
            icon: Database,
          },
        ],
      })
    }

    return groups
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-6">
        <div className="flex flex-col items-start gap-2 pl-2">
          <Logo className="h-8" />
          <Link className="text-sm font-semibold" href='/'>Админ-панель</Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4">
          <Accordion type="multiple" className="w-full">
            {getNavigationGroups().map((group) => (
              <AccordionItem key={group.title} value={group.title} className="border-none">
                <AccordionTrigger className="py-2 text-sm font-medium">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.url)
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            className={cn(
                              active && 'bg-sidebar-accent text-sidebar-accent-foreground'
                            )}>
                            <Link href={item.url}>
                              <Icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Темная тема</span>
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Светлая тема</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(() => {
                    window.location.href = '/login'
                  })
                }}>
                <span>Выход</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
      <SidebarRail onMouseDown={handleMouseDown} />
    </Sidebar>
  )
}

