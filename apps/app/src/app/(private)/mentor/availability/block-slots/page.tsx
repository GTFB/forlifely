import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MentorBlockSlotsPage() {
  return (
    <RolePageShell
      role="mentor"
      title="Block Time Slots"
      description="Define unavailable periods and override recurring availability."
    />
  );
}

