import { Metadata } from "next";
import DealEditPageClient from "./page.client";

export const metadata: Metadata = {
  title: 'Редактировать заявку::Esnad Finance',
  description: 'Редактировать заявку::Esnad Finance',
}
export default function DealEditPage() {
  return <DealEditPageClient />
}