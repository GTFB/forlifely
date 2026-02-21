import MentorAuthGuard from "@/components/cabinet/MentorAuthGuard";
import { RoleCabinetLayout } from "@/components/cabinet/RoleCabinetLayout";

import { MENTOR_NAV_ITEMS } from "./nav";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorAuthGuard>
      <RoleCabinetLayout
        role="mentor"
        title="Mentor Cabinet"
        subtitle="Manage sessions, availability, payouts, and mentoring workflow."
        navItems={MENTOR_NAV_ITEMS}
      >
        {children}
      </RoleCabinetLayout>
    </MentorAuthGuard>
  );
}

