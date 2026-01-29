import { ReactNode } from "react"
import SLayout from "@/components/s/SLayout"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <SLayout>
      {children}
    </SLayout>
  )
}


