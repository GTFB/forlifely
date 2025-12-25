import { Metadata } from "next";
import DealsPageClient from "./page.client";

export const metadata: Metadata = {
  title: 'Мои рассрочки::Esnad Finance',
  description: 'Мои рассрочки::Esnad Finance',
}
export default function DealsPage() {
  return <DealsPageClient />
}