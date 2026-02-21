import type { RoleCabinetNavItem } from "@/components/cabinet/RoleCabinetLayout";

export const MENTOR_NAV_ITEMS: RoleCabinetNavItem[] = [
  { label: "Dashboard", href: "/mentor", icon: "gauge" },
  { label: "Profile", href: "/mentor/profile", icon: "user" },
  { label: "Availability", href: "/mentor/availability", icon: "calendarClock" },
  { label: "Bookings", href: "/mentor/bookings", icon: "calendarCheck" },
  { label: "Reviews", href: "/mentor/reviews", icon: "messageSquare" },
  { label: "Session Preparation", href: "/mentor/sessions/preparation", icon: "clipboardList" },
  { label: "Session Join", href: "/mentor/sessions/join", icon: "playCircle" },
  { label: "Session Waiting Room", href: "/mentor/sessions/waiting-room", icon: "videoIcon" },
  { label: "Session Room", href: "/mentor/sessions/room", icon: "video" },
  { label: "Session Summary", href: "/mentor/sessions/summary", icon: "bookOpen" },
  { label: "End Session", href: "/mentor/sessions/end", icon: "videoOff" },
  { label: "Payouts", href: "/mentor/payments/payouts", icon: "handCoins" },
  { label: "Notifications", href: "/mentor/notifications", icon: "heartHandshake" },
  { label: "Content Library", href: "/mentor/content-library", icon: "library" },
  { label: "Journal", href: "/mentor/journal", icon: "notebookText" },
  { label: "Privacy", href: "/mentor/privacy", icon: "shieldCheck" },
  { label: "Settings", href: "/mentor/settings", icon: "settings" },
];

