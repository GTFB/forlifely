import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MentorAvailabilityPage() {
  return (
    <RolePageShell
      role="mentor"
      title="Set Availability"
      description="Weekly recurring schedule, session duration, buffer times, and blocked time slots."
    />
  );
}

