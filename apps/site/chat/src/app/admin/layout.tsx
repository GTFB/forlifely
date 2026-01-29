import { ReactNode } from "react"
import { Metadata } from "next"
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { AdminSocketProvider } from "@/components/admin/AdminSocketProvider";

export const metadata: Metadata = {
  title: {
    template: "%s - Admin Panel",
    default: "Admin Panel",
  },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSocketProvider>
        <AdminAuthGuard>
          <main>{children}</main>
        </AdminAuthGuard>
      </AdminSocketProvider>
    </div>
  );
}
