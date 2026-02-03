import { SiteLocaleProvider } from "@/contexts/LocaleContext";
import { PROJECT_SETTINGS, LANGUAGES } from "@/settings";

export async function generateStaticParams() {
  return LANGUAGES.map(l=>{
    return {
      locale: l.code
    }
  })
}

export default async function Layout({params, children}: {params: Promise<{locale: string}>,  children: React.ReactNode;}){
    const {locale} = await params
    return <SiteLocaleProvider locale={locale}>
        {children}
    </SiteLocaleProvider>
}