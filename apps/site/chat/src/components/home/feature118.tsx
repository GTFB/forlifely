import {
  CheckCircle2,
  LucideGitGraph,
  MessageSquare,
  Star,
  Zap,
} from "lucide-react";

const Feature118 = () => {
  return (
    <section className="bg-muted/60 py-32">
      <div className="container">
        <div className="flex flex-col gap-10">
          <div className="mx-auto flex max-w-xl flex-col gap-2.5 text-center">
            <h1 className="text-4xl font-semibold md:text-5xl">
              Key Features That Save You Time
            </h1>
            <p className="text-muted-foreground">
              Explore tools specifically built to enhance your workflow and
              boost efficiency.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-3 lg:gap-12">
            <div className="bg-background col-span-2 grid gap-7 rounded-lg p-7 md:grid-cols-2">
              <div className="flex h-full flex-col justify-between gap-3">
                <div>
                  <span className="bg-muted flex size-14 items-center justify-center rounded-full">
                    <LucideGitGraph className="h-auto w-5" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold lg:text-3xl">
                    Generate detailed reports with just a few clicks
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Use our powerful tools to simplify reporting and make
                  data-driven decisions faster.
                </p>
              </div>
              <img
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
                alt="placeholder"
                className="aspect-video h-full w-full rounded-xl object-cover md:aspect-auto"
              />
            </div>
            <div className="bg-background rounded-lg p-7">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <span className="bg-muted flex size-14 items-center justify-center rounded-full">
                    <Zap className="h-auto w-5" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold lg:text-3xl">
                    Seamless collaboration with your team
                  </h2>
                </div>
                <ul className="flex flex-col gap-5">
                  <li className="flex gap-2">
                    <CheckCircle2 className="shrink-0" />
                    Real-time collaboration
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="shrink-0" />
                    Immediate feedback
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="shrink-0" />
                    Assign tasks effortlessly
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-background grid items-center gap-12 rounded-lg p-7 md:p-10 lg:grid-cols-3">
            <h2 className="text-xl font-semibold lg:text-3xl">
              Generate detailed reports with just a few clicks
            </h2>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-semibold md:text-5xl">99%</span>
              <p className="text-muted-foreground">
                Track and analyze business metrics efficiently
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-semibold md:text-5xl">5.0</span>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  <Star className="fill-primary" />
                  <Star className="fill-primary" />
                  <Star className="fill-primary" />
                  <Star className="fill-primary" />
                  <Star className="fill-primary" />
                </div>
                <p className="text-muted-foreground">
                  Rated as the top-performing platform
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <MessageSquare className="h-auto w-4" />
            <p className="text-center">
              Need more info? Reach out to our team.
            </p>
            <a href="#" className="underline">
              Let&apos;s chat
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Feature118 };
