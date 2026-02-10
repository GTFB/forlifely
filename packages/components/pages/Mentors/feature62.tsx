import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/Container";

export interface Feature62Item {
  imageSrc: string;
  title: string;
  description: string;
  imageRight: boolean;
}

export interface Feature62Content {
  heading: string;
  description: string;
  items: Feature62Item[];
}

const DEFAULT_CONTENT: Feature62Content = {
  heading: "Lifely turns stress into a trusted, simple plan",
  description:
    "Feeling overwhelmed is normal, but Lifely is here to help! We match you with a mentor who's walked this path and helps you set small, doable goals. Our mentors work with you to create a plan that works for you, but also creates much more:",
  items: [],
};

interface Feature62Props {
  className?: string;
  content?: Feature62Content;
}

const Feature62 = ({ className, content: contentProp }: Feature62Props) => {
  const content = contentProp ?? DEFAULT_CONTENT;
  const { heading, description, items } = content;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-32", className)}>
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h2 className="mb-2 text-center text-3xl font-semibold lg:text-4xl">
            {heading}
          </h2>
          <p className="text-center text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>
        <div className="mt-10 flex flex-col space-y-10 md:mt-14 md:space-y-16">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "lg:flex lg:gap-x-4",
                item.imageRight && "flex-row-reverse",
              )}
            >
              <div className="lg:w-1/2">
                <div className="mb-6 md:mb-8 lg:mb-0">
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="aspect-4/3 w-full rounded-md border border-border object-cover object-top"
                  />
                </div>
              </div>
              <div
                className={cn(
                  "lg:flex lg:w-1/2 lg:items-center 2xl:pl-32",
                  item.imageRight ? "lg:pr-24" : "lg:pl-24",
                )}
              >
                <div>
                  <h3 className="mb-3 text-xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground lg:text-lg">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export { Feature62 };
