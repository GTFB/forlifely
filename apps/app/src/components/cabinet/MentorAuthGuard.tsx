"use client";

import RoleAuthGuard from "@/components/guards/RoleAuthGuard";

interface MentorAuthGuardProps {
  children: React.ReactNode;
}

export default function MentorAuthGuard({ children }: MentorAuthGuardProps) {
  return <RoleAuthGuard allowedRoles={["mentor"]}>{children}</RoleAuthGuard>;
}

