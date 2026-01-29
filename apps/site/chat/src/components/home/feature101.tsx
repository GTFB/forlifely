import { Blocks, ChartPie, Filter, UsersRound } from "lucide-react";

const Feature101 = () => {
  return (
    <section className="py-32">
      <div className="container">
        <div className="gap mx-auto flex max-w-xl flex-col justify-center gap-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Our Capabilities</h1>
          <p className="text-muted-foreground text-xl">
            Discover the full potential of our platform&apos;s advanced
            capabilities
          </p>
        </div>
        <div className="mx-auto mt-20 grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-muted/70 flex flex-col justify-between gap-6 rounded-lg p-8 md:col-span-2 lg:row-span-2">
            <div>
              <Blocks className="mb-6 h-auto w-11" strokeWidth={1.5} />
              <h2 className="mb-1 text-2xl font-medium">
                Seamless Integration
              </h2>
              <p className="text-muted-foreground">
                Connect effortlessly with various data sources.
              </p>
            </div>
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-aspect-video-1.svg"
              alt="integration feature"
              className="ml-auto max-h-80 w-full rounded-lg object-cover transition-transform duration-300 hover:-translate-y-3 sm:w-11/12"
            />
          </div>
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <Filter className="mb-6 h-auto w-11" strokeWidth={1.5} />
            <div>
              <h2 className="mb-1 text-2xl font-medium">Data Refinement</h2>
              <p className="text-muted-foreground">
                Ensure clean and reliable data for actionable insights.
              </p>
            </div>
          </div>
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <ChartPie className="mb-6 h-auto w-11" strokeWidth={1.5} />
            <div>
              <h2 className="mb-1 text-2xl font-medium">Visual Analytics</h2>
              <p className="text-muted-foreground">
                Transform data into impactful visual stories.
              </p>
            </div>
          </div>
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <UsersRound className="mb-6 h-auto w-11" strokeWidth={1.5} />
            <div>
              <h2 className="mb-1 text-2xl font-medium">Team Collaboration</h2>
              <p className="text-muted-foreground">
                Work together to make informed decisions.
              </p>
            </div>
          </div>
          <div className="bg-muted/70 flex h-80 flex-col-reverse justify-between gap-4 rounded-lg p-8 lg:col-span-2 lg:grid lg:grid-cols-2">
            <div className="lg:self-end">
              <h2 className="mb-1 text-2xl font-medium">Unified Platform</h2>
              <p className="text-muted-foreground">
                Centralize your processes and optimize efficiency.
              </p>
            </div>
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-aspect-video-1.svg"
              alt="platform feature"
              className="h-full min-h-0 rounded-lg object-cover transition-transform duration-300 hover:-translate-y-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export { Feature101 };
