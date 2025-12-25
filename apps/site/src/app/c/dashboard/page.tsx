import { Metadata } from "next";
import ConsumerDashboardPageClient from "./page.client";

export const metadata: Metadata = {
  title: 'Личный кабинет::Esnad Finance',
  description: 'Личный кабинет::Esnad Finance',
}
export default function ConsumerDashboardPage() {
  return <ConsumerDashboardPageClient />
}