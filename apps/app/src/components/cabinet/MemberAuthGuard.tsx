"use client";

import RoleAuthGuard from "@/components/guards/RoleAuthGuard";

interface MemberAuthGuardProps {
  children: React.ReactNode;
}

export default function MemberAuthGuard({ children }: MemberAuthGuardProps) {
  return <RoleAuthGuard allowedRoles={["member"]}>{children}</RoleAuthGuard>;
}

