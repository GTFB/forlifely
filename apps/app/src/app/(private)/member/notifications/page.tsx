import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberNotificationsPage() {
  return (
    <RolePageShell
      role="member"
      title="Notification Center"
      description="Notification list with unread/read states and bulk actions."
    />
  );
}

