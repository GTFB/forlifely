import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/Container";
import { Button } from "@/components/ui/button";

export interface Feature183Step {
  title: string;
  description: string;
}

export interface Feature183Content {
  heading: string;
  description: string;
  steps: [Feature183Step, Feature183Step, Feature183Step];
  buttonLabel: string;
  buttonHref?: string;
}

const IMAGE_SRC = "/images/4.jpg";

interface StepItemProps {
  step: Feature183Step;
  number: number;
  isLast: boolean;
  className?: string;
}

const StepItem = ({ step, number, isLast, className }: StepItemProps) => (
  <div
    className={cn(
      "max-lg:flex max-lg:gap-4",
      className
    )}
  >
    <div className="relative lg:py-6">
      <div
        className={cn(
          "absolute h-full w-1 -translate-x-1/2 translate-y-11 max-lg:left-1/2 lg:top-1/2 lg:h-1 lg:w-full lg:translate-x-6 lg:-translate-y-1/2",
          isLast
            ? "bg-linear-to-b from-muted/50 to-background lg:bg-linear-to-r lg:from-muted/50 lg:to-background"
            : "bg-muted/50"
        )}
      />
      <div className="relative z-0 grid size-11 shrink-0 place-content-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
        {number}
      </div>
    </div>
    <div className="max-lg:mt-2">
      <p className="text-lg font-semibold text-foreground">{step.title}</p>
      <p className="mt-2 text-muted-foreground">{step.description}</p>
    </div>
  </div>
);

interface Feature183Props {
  className?: string;
  content: Feature183Content;
}

const Feature183 = ({ className, content }: Feature183Props) => {
  const { heading, description, steps, buttonLabel, buttonHref = "#" } =
    content;

  return (
    <section className={cn("py-32", className)}>
      <style>{`
        @media (min-width: 768px) {
          .feature183-hero-img {
            object-position: center calc(50% + 140px);
          }
        }
      `}</style>
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h2 className="mb-2 text-center text-3xl font-semibold lg:text-4xl">
            {heading}
          </h2>
          <p className="text-center text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>
        <div className="mt-14 w-full shrink-0 overflow-hidden rounded-3xl md:max-h-104">
          <img
            src={IMAGE_SRC}
            alt=""
            className="feature183-hero-img aspect-video w-full rounded-3xl object-cover object-top md:max-h-104 md:h-104 md:aspect-auto"
          />
        </div>
        <div className="mt-14 grid w-full gap-10 lg:grid-cols-3 lg:gap-6">
          {steps.map((step, index) => (
            <StepItem
              key={index}
              step={step}
              number={index + 1}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild className="rounded-full">
            <Link href={buttonHref}>{buttonLabel}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
};

export { Feature183 };
