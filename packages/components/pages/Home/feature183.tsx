import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/container";
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

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  className?: string;
}

const StepCard = ({ number, title, description, className }: StepCardProps) => (
  <div className={cn("flex w-full max-w-full flex-col gap-4 lg:max-w-52 lg:mx-0", className)}>
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
      {number}
    </div>
    <span className="text-lg font-bold">{title}</span>
    <p className="text-muted-foreground">{description}</p>
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
        <div className="mt-14 w-full shrink-0 overflow-hidden rounded-3xl md:max-h-[26rem]">
          <img
            src={IMAGE_SRC}
            alt=""
            className="feature183-hero-img aspect-video w-full rounded-3xl object-cover object-top md:max-h-[26rem] md:h-[26rem] md:aspect-auto"
          />
        </div>
        <div className="-mx-4 mt-14 flex flex-col items-stretch gap-x-24 gap-y-8 px-4 md:mx-4 md:px-4 lg:flex-row lg:justify-center lg:items-start">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={index + 1}
              title={step.title}
              description={step.description}
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
