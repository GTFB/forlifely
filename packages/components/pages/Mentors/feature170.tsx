import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/container";

export interface Feature170Card {
  title: string;
  description: string;
  bullets: Array<{ bold: string; text: string }>;
}

export interface Feature170Content {
  heading: string;
  description: string;
  cards: Feature170Card[];
}

interface Feature170Props {
  className?: string;
  content?: Feature170Content;
}

const Feature170 = ({ className, content }: Feature170Props) => {
  if (!content?.heading || !Array.isArray(content.cards) || content.cards.length === 0) {
    return null;
  }

  const { heading, description, cards } = content;

  return (
    <section className={cn("py-32", className)}>
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-4 text-center lg:py-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            {heading}
          </h2>
          <p className="text-muted-foreground md:text-lg">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex flex-col rounded-lg border border-border bg-card shadow-sm"
            >
              <div className="h-1 rounded-t-lg bg-primary" />
              <div className="flex flex-1 flex-col gap-4 p-6">
                <h3 className="text-lg font-semibold leading-tight lg:text-xl">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {card.bullets.map((item, i) => (
                    <li key={i} className="flex gap-1">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-semibold text-foreground">
                          {item.bold}
                        </span>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export { Feature170 };
