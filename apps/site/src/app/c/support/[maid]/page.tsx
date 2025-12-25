import { Metadata } from "next";
import SupportChatPageClient from "./page.client";

export const metadata: Metadata = {   
  title: 'Поддержка - Чат::Esnad Finance',
  description: 'Поддержка - Чат::Esnad Finance',
}
export default function SupportChatPage() {
  return <SupportChatPageClient />
}