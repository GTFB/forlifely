import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberBookingsPage() {
  return (
    <RolePageShell
      role="member"
      title="My Bookings"
      description="Upcoming, past, and cancelled bookings with status and mentor filters."
    />
  );
}

