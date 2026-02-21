import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberTransactionHistoryPage() {
  return (
    <RolePageShell
      role="member"
      title="Transaction History"
      description="Purchase, usage, and refund history with filtering by type/date/status."
    />
  );
}

