import { Metadata } from "next"
import ProfilePageClient from "./page.client"

export const metadata: Metadata = {
  title: 'Мой профиль - Личные данные::Esnad Finance',
  description: 'Мой профиль - Личные данные::Esnad Finance',
}
export default function ProfilePage() {
  return <ProfilePageClient />
}