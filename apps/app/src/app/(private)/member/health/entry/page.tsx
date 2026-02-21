import { RolePageShell } from "@/components/cabinet/RolePageShell";

export default function MemberHealthEntryPage() {
  return (
    <RolePageShell
      role="member"
      title="Health Metric Entry"
      description="Daily health data entry form for glucose, sleep, activity, and wellbeing."
    />
  );
}

