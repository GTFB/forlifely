import { Metadata } from "next"
import SupportPageClient from "./page.client"

export const metadata: Metadata = {
  title: 'Поддержка::Esnad Finance',
  description: 'Поддержка::Esnad Finance',
}
export default function SupportPage() {
  return <SupportPageClient />
}