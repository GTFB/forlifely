import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberMedicationSettingsPage() {
  return (
    <RolePageShell
      role="member"
      title="Medication Settings"
      description="Medication names, dosages, schedule, and notification preferences."
    />
  );
}

