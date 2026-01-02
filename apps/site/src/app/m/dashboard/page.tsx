import { Metadata } from "next"
import AdminDashboardPageClient from "./page.client"

export const metadata: Metadata = {
  title: 'Общая сводка::Esnad Finance',
  description: 'Общая сводка::Esnad Finance',
}
export default function AdminDashboardPage() {
  return <AdminDashboardPageClient />
}