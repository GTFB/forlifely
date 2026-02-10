import {
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Youtube,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/Container";
import { Logo } from "@/components/misc/logo/logo";

const TAGLINE = "Don't face diabetes alone";

const aboutLinks = [
  { name: "About us", href: "/about" },
  { name: "For members", href: "/members" },
  { name: "For mentors", href: "/mentors" },
];

const moreLinks = [
  { name: "Partner with us", href: "/meet-us" },
  { name: "For investors", href: "/investors" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "TikTok", href: "#", icon: Music2 },
  { label: "YouTube", href: "#", icon: Youtube },
  { label: "LinkedIn", href: "#", icon: Linkedin },
];

const COPYRIGHT = "2025, Lifely Inc. All rights reserved.";

interface Footer11Props {
  className?: string;
}

const Footer11 = ({ className }: Footer11Props) => {
  return (
    <section className={cn("py-16 md:py-24 lg:py-32", className)}>
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 py-4 md:flex-row lg:py-8">
          {/* Logo + tagline */}
          <div className="flex w-full flex-col gap-3 md:w-auto">
            <a href="/" className="inline-block">
              <Logo className="h-8 justify-start" />
            </a>
            <p className="text-xl font-semibold text-purple-900 md:text-2xl">
              {TAGLINE}
            </p>
          </div>

          {/* Menu */}
          <div className="flex w-full flex-col gap-6 md:w-auto md:flex-row md:gap-12 lg:gap-16">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                About Lifely
              </h3>
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
                {aboutLinks.map((link, i) => (
                  <span key={link.name} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-muted-foreground">·</span>
                    )}
                    <a
                      href={link.href}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {link.name}
                    </a>
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                More on Lifely
              </h3>
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
                {moreLinks.map((link, i) => (
                  <span key={link.name} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-muted-foreground">·</span>
                    )}
                    <a
                      href={link.href}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {link.name}
                    </a>
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Follow us
              </h3>
              <div className="mt-3 flex gap-4">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 border-t pt-6 text-sm text-muted-foreground">
          {COPYRIGHT}
        </p>
      </Container>
    </section>
  );
};

export { Footer11 };
