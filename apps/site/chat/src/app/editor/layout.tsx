import { ReactNode } from "react"
import { Metadata } from "next"
import EditorAuthGuard from "@/components/editor/EditorAuthGuard";
import { AdminSocketProvider } from "@/components/admin/AdminSocketProvider";

export const metadata: Metadata = {
  title: {
    template: "%s - Editor Panel",
    default: "Editor Panel",
  },
}

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSocketProvider>
        <EditorAuthGuard>
          <main>{children}</main>
        </EditorAuthGuard>
      </AdminSocketProvider>
    </div>
  );
}

