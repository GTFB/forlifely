import { ReactNode } from "react"
import MLayout from "@/components/m/MLayout"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <MLayout>
      {children}
    </MLayout>
  )
}


