import MemberAuthGuard from "@/components/cabinet/MemberAuthGuard";
import { RoleCabinetLayout } from "@/components/cabinet/RoleCabinetLayout";

import { MEMBER_NAV_ITEMS } from "./nav";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberAuthGuard>
      <RoleCabinetLayout
        role="member"
        title="Member Cabinet"
        subtitle="Manage your mentor journey, sessions, health data, and settings."
        navItems={MEMBER_NAV_ITEMS}
      >
        {children}
      </RoleCabinetLayout>
    </MemberAuthGuard>
  );
}

