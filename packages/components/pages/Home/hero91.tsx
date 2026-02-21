import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/Container";
import { Button } from "@/components/ui/button";

export interface Hero91Content {
  title: string;
  description: string;
  button1: string;
  button2: string;
  subtitle?: string;
}

interface Hero91Props {
  className?: string;
  content: Hero91Content;
  button1Href?: string;
  button2Href?: string;
}

const Hero91 = ({
  className,
  content,
  button1Href,
  button2Href,
}: Hero91Props) => {
  const { title, description, button1, button2, subtitle } = content;

  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-5rem)] flex-col items-center bg-background pt-0 pb-14 lg:py-14 lg:flex-row lg:items-center",
        className,
      )}
    >
      <div className="relative z-0 w-full shrink-0 overflow-hidden lg:hidden">
        <img
          src="/images/1.jpg"
          alt=""
          className="aspect-video w-full object-cover object-top"
        />
      </div>
      <Container className="relative z-10 mt-6 flex-1 lg:mt-0">
        <div className="flex max-w-2xl flex-col gap-5">
          {subtitle != null && subtitle !== "" && (
            <p className="font-light text-foreground uppercase">{subtitle}</p>
          )}
          <h1 className="text-5xl font-medium text-foreground md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="my-8 text-foreground md:text-xl">{description}</p>
          <div className="flex flex-col gap-4 font-medium md:flex-row">
            {button1Href ? (
              <Button asChild className="h-fit cursor-pointer items-center gap-1 rounded-full px-6 py-3">
                <Link href={button1Href}>{button1}</Link>
              </Button>
            ) : (
              <Button className="h-fit cursor-pointer items-center gap-1 rounded-full px-6 py-3">
                {button1}
              </Button>
            )}
            {button2Href ? (
              <Button asChild variant="outlinePrimary" className="h-fit cursor-pointer rounded-full px-6 py-3">
                <Link href={button2Href}>{button2}</Link>
              </Button>
            ) : (
              <Button variant="outlinePrimary" className="h-fit cursor-pointer rounded-full px-6 py-3">
                {button2}
              </Button>
            )}
          </div>
        </div>
      </Container>
      <div className="absolute right-0 top-1/2 hidden h-[720px] w-[45%] min-w-[320px] -translate-y-1/2 overflow-hidden rounded-l-full bg-black lg:block">
        <img
          src="/images/1.jpg"
          alt=""
          className="h-full w-full rounded-tl-xl object-cover"
        />
      </div>
    </section>
  );
};

export { Hero91 };
