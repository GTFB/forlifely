import { Navbar9 } from "./navbar9";
import { Footer30 } from "./footer30";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar9 />
      <main className="flex-1">{children}</main>
      <Footer30 />
      <CookieConsent />
      <ScrollToTop />
    </div>
  );
}

