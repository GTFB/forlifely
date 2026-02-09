import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/container";
import { Button } from "@/components/ui/button";

export interface Feature27CardContent {
  title: string;
  description: string;
  button: string;
}

export interface Feature27Content {
  heading: string;
  description: string;
  cardMembers: Feature27CardContent;
  cardMentors: Feature27CardContent;
}

const CARD_MEMBERS_HREF = "/members";
const CARD_MENTORS_HREF = "/mentors";
const IMAGE_MEMBERS = "/images/2.jpg";
const IMAGE_MENTORS = "/images/3.jpg";

interface Feature27Props {
  className?: string;
  content: Feature27Content;
}

const Feature27 = ({ className, content }: Feature27Props) => {
  const { heading, description, cardMembers, cardMentors } = content;

  return (
    <section className={cn("bg-muted py-32", className)}>
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h2 className="mb-2 text-center text-3xl font-semibold lg:text-4xl">
            {heading}
          </h2>
          <p className="text-center text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>
        <div className="mt-20 grid gap-10 md:grid-cols-2">
          <div>
            <img
              src={IMAGE_MEMBERS}
              alt=""
              className="aspect-video w-full rounded-lg border object-cover object-top"
            />
            <div className="px-4 pt-10">
              <h3 className="text-lg font-bold">{cardMembers.title}</h3>
              <p className="mt-2 text-muted-foreground">
                {cardMembers.description}
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href={CARD_MEMBERS_HREF}>{cardMembers.button}</Link>
              </Button>
            </div>
          </div>
          <div>
            <img
              src={IMAGE_MENTORS}
              alt=""
              className="aspect-video w-full rounded-lg border object-cover object-top"
            />
            <div className="px-4 pt-10">
              <h3 className="text-lg font-bold">{cardMentors.title}</h3>
              <p className="mt-2 text-muted-foreground">
                {cardMentors.description}
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href={CARD_MENTORS_HREF}>{cardMentors.button}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { Feature27 };
