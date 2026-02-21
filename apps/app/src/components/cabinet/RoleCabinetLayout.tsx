"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  BookHeart,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  DollarSign,
  FileDown,
  Gauge,
  HandCoins,
  Heart,
  HeartHandshake,
  HeartPulse,
  Library,
  MessageSquare,
  NotebookText,
  Pill,
  PlayCircle,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Stethoscope,
  UserCircle2,
  Video,
  VideoIcon,
  VideoOff,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Logo } from "@/components/misc/logo/logo";
import { useTranslations } from "@/hooks/use-translations";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export interface RoleCabinetNavItem {
  label: string;
  href: string;
  icon:
    | "gauge"
    | "user"
    | "calendarClock"
    | "calendarCheck"
    | "messageSquare"
    | "clipboardList"
    | "clipboardPlus"
    | "playCircle"
    | "videoIcon"
    | "video"
    | "bookOpen"
    | "videoOff"
    | "handCoins"
    | "heartHandshake"
    | "library"
    | "notebookText"
    | "shieldCheck"
    | "settings"
    | "heart"
    | "search"
    | "bookHeart"
    | "checkCircle2"
    | "badgeDollarSign"
    | "wallet"
    | "dollarSign"
    | "heartPulse"
    | "stethoscope"
    | "activity"
    | "smile"
    | "pill"
    | "fileDown";
}

const NAV_ICONS: Record<RoleCabinetNavItem["icon"], LucideIcon> = {
  gauge: Gauge,
  user: UserCircle2,
  calendarClock: CalendarClock,
  calendarCheck: CalendarCheck,
  messageSquare: MessageSquare,
  clipboardList: ClipboardList,
  clipboardPlus: ClipboardPlus,
  playCircle: PlayCircle,
  videoIcon: VideoIcon,
  video: Video,
  bookOpen: BookOpen,
  videoOff: VideoOff,
  handCoins: HandCoins,
  heartHandshake: HeartHandshake,
  library: Library,
  notebookText: NotebookText,
  shieldCheck: ShieldCheck,
  settings: Settings,
  heart: Heart,
  search: Search,
  bookHeart: BookHeart,
  checkCircle2: CheckCircle2,
  badgeDollarSign: BadgeDollarSign,
  wallet: Wallet,
  dollarSign: DollarSign,
  heartPulse: HeartPulse,
  stethoscope: Stethoscope,
  activity: Activity,
  smile: Smile,
  pill: Pill,
  fileDown: FileDown,
};

interface RoleCabinetLayoutProps {
  role: "mentor" | "member";
  title: string;
  subtitle?: string;
  navItems: RoleCabinetNavItem[];
  children: React.ReactNode;
}

export function RoleCabinetLayout({
  role,
  title,
  subtitle,
  navItems,
  children,
}: RoleCabinetLayoutProps) {
  const pathname = usePathname() ?? "";
  const { translations } = useTranslations();
  const roleRoot = role === "mentor" ? "/mentor" : "/member";

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b p-4 group-data-[collapsible=icon]:p-2">
            <Link
              href={roleRoot}
              className="flex items-center justify-start py-1 group-data-[collapsible=icon]:justify-center"
            >
              <Logo className="h-8 group-data-[collapsible=icon]:h-6" />
            </Link>
            <div className="mt-2 space-y-1 group-data-[collapsible=icon]:hidden">
              <h2 className="text-base font-semibold">{title}</h2>
              {subtitle ? (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const navPathKey =
                      item.href
                        .split("/")
                        .filter(Boolean)
                        .slice(1)
                        .join("_") || "dashboard";
                    const localizedLabel =
                      translations?.cabinet?.[role]?.pages?.[navPathKey]?.title ?? item.label;
                    const Icon = NAV_ICONS[item.icon];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <Icon />
                            <span>{localizedLabel}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <p className="text-sm text-muted-foreground">
              {navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? title}
            </p>
          </header>
          <main className={cn("p-4 md:p-6")}>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

