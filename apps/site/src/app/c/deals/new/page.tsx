import { Metadata } from "next";
import NewDealPageClient from "./page.client";

export const metadata: Metadata = { 
  title: 'Подать заявку::Esnad Finance',
  description: 'Подать заявку::Esnad Finance',
}
export default function NewDealPage() {
  return <NewDealPageClient />
} 