import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberSettingsPage() {
  return (
    <RolePageShell
      role="member"
      title="Settings"
      description="Account information, security/login, payment settings, and preferences."
    />
  );
}

