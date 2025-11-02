"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const TeamSwitcher = React.memo(function TeamSwitcher({
  teams,
  translations,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
  translations?: any
}) {
  const { isMobile, state } = useSidebar()
  const router = useRouter()
  const isCollapsed = state === "collapsed"
  // Use ref to track teams to avoid unnecessary state updates
  const teamsRef = React.useRef(teams)
  const [activeTeam, setActiveTeam] = React.useState(() => teams[0])
  
  // Update activeTeam if teams reference or structure changes
  React.useEffect(() => {
    // Only update if teams reference changed or first team changed significantly
    if (teamsRef.current !== teams || 
        (teams[0] && (!activeTeam || activeTeam !== teams[0]))) {
      teamsRef.current = teams
      if (teams[0] && (!activeTeam || activeTeam !== teams[0])) {
        setActiveTeam(teams[0])
      }
    }
  }, [teams, activeTeam])

  const t = React.useMemo(() => {
    if (!translations) {
      return {
        teamSwitcher: { teamsLabel: "Teams", addTeam: "Add team" },
        dashboard: { title: "Dashboard" },
      }
    }
    return {
      teamSwitcher: translations.teamSwitcher || { teamsLabel: "Teams", addTeam: "Add team" },
      dashboard: translations.dashboard || { title: "Dashboard" },
    }
  }, [translations])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                      isCollapsed && "!rounded-none"
                    )}
                  >
                    {typeof activeTeam.logo === 'function' ? (
                      <>
                        {isCollapsed ? (
                          <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-none">
                            <Image
                              src="/images/favicon.jpg"
                              alt="Favicon"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain rounded-none"
                            />
                          </div>
                        ) : (
                          <>
                            <activeTeam.logo className="h-8" />
                            <ChevronsUpDown className="ml-auto" />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                          <activeTeam.logo className="size-4" />
                        </div>
                        {!isCollapsed && (
                          <>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-medium">{activeTeam.name}</span>
                              <span className="truncate text-xs">{activeTeam.plan}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                          </>
                        )}
                      </>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" align="center" sideOffset={8}>
                  <p>{activeTeam.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t.teamSwitcher.teamsLabel}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push("/admin/dashboard")}
              className="gap-2 p-2"
            >
              {t.dashboard.title}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">{t.teamSwitcher.addTeam}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}, (prevProps, nextProps) => {
  // If teams reference is the same, skip deep comparison (mutations happen in-place)
  if (prevProps.teams === nextProps.teams && prevProps.translations === nextProps.translations) {
    return true // Same references - skip re-render
  }
  
  // Compare teams structure
  if (prevProps.teams.length !== nextProps.teams.length) {
    return false
  }
  
  for (let i = 0; i < prevProps.teams.length; i++) {
    // Only check logo reference and plan - name is mutated in-place, so we ignore it
    if (
      prevProps.teams[i].logo !== nextProps.teams[i].logo ||
      prevProps.teams[i].plan !== nextProps.teams[i].plan
    ) {
      return false
    }
  }
  
  // For translations, compare by reference (they should be stable)
  if (prevProps.translations !== nextProps.translations) {
    // If translations changed, check if relevant sections are actually different
    const prevTeamSwitcher = prevProps.translations?.teamSwitcher
    const nextTeamSwitcher = nextProps.translations?.teamSwitcher
    const prevDashboard = prevProps.translations?.dashboard
    const nextDashboard = nextProps.translations?.dashboard
    
    if (
      (prevTeamSwitcher !== nextTeamSwitcher && JSON.stringify(prevTeamSwitcher) !== JSON.stringify(nextTeamSwitcher)) ||
      (prevDashboard !== nextDashboard && JSON.stringify(prevDashboard) !== JSON.stringify(nextDashboard))
    ) {
      return false // Re-render needed
    }
  }
  
  return true // Skip re-render
})
