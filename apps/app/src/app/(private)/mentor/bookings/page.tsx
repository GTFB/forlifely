import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MentorBookingsPage() {
  return (
    <RolePageShell
      role="mentor"
      title="My Bookings"
      description="List of upcoming, past, and cancelled sessions with filtering and access to post-session records."
    />
  );
}

