import { ArrowRight, Heart, Lightbulb, Shield, UserPen } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

const values = [
  {
    title: "User-Centered Design",
    description:
      "We prioritize the user experience, ensuring every feature adds real value and is intuitive to use.",
    icon: UserPen,
  },
  {
    title: "Continuous Innovation",
    description:
      "We are committed to pushing boundaries, and evolving to meet the needs of modern teams.",
    icon: Lightbulb,
  },
  {
    title: "Integrity and Transparency",
    description:
      "We build with honesty and clarity, fostering trust with our users and partners.",
    icon: Shield,
  },
];

interface Feature170Props {
  className?: string;
}

const Feature170 = ({ className }: Feature170Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col gap-6 py-4 lg:py-8">
          <Badge
            variant="outline"
            className="w-fit gap-1 bg-card px-3 text-sm font-normal tracking-tight shadow-sm"
          >
            <Heart className="size-4" />
            <span>We live by</span>
          </Badge>
          <h2 className="text-3xl leading-tight tracking-tight md:text-4xl lg:text-6xl">
            Our Core Values
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">
              We believe in principles that guide our growth and inspire our
              community.
            </p>
            <p className="inline-flex items-center gap-1 text-primary">
              <span className="underline">Learn More</span>
              <ArrowRight className="size-4" />
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {values.map((value, index) => (
            <div className="flex gap-2.5" key={index}>
              <value.icon className="mt-0.5 size-[18px] shrink-0" />
              <div>
                <h3 className="text-lg leading-none! tracking-[-0.96px] lg:text-2xl">
                  {value.title}
                </h3>
                <p className="mt-2.5 text-sm tracking-[-0.36px] text-muted-foreground">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Feature170 };
