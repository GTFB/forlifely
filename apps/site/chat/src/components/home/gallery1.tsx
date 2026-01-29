"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/packages/components/misc/layout/Container";

const data = [
  {
    id: "item-1",
    title: "World Builder",
    href: "#",
    image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-dark-1.svg",
    logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-wordmark.svg",
    company: "Граф персонажей",
    badges: ["Граф", "Персонажи"],
  },
  {
    id: "item-2",
    title: "Writing Desk",
    href: "#",
    image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-dark-2.svg",
    logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/astro-wordmark.svg",
    company: "Режим Zen",
    badges: ["Zen Mode", "Темная тема"],
  },
  {
    id: "item-3",
    title: "Publisher Dashboard",
    href: "#",
    image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-dark-3.svg",
    logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/vercel-wordmark.svg",
    company: "Аналитика",
    badges: ["Аналитика", "Продажи"],
  },
];

const Gallery1 = () => {
  const [selection, setSelection] = useState(data[0].id);
  return (
    <section className="py-32">
      <Container>
        <div className="lg:aspect-1336/420 flex flex-col gap-5 lg:flex-row">
          {data.map((item) => (
            <div
              key={item.id}
              data-state={selection === item.id ? "open" : "closed"}
              className='md:max-lg:aspect-1336/420 lg:data-[state="open"]:duration-400 group max-lg:w-full max-lg:flex-1 max-md:h-[200px] lg:transform-gpu lg:transition-all lg:data-[state="closed"]:w-[20%] lg:data-[state="open"]:w-[60%] lg:data-[state="closed"]:duration-500'
              onMouseEnter={() => {
                setSelection(item.id);
              }}
            >
              <a
                href={item.href}
                className="bg-primary dark:bg-card text-primary-foreground relative block h-full w-full overflow-hidden rounded-xl"
              >
                <div className='absolute -inset-[50%] hidden h-[200%] w-[200%] md:block lg:group-data-[state="closed"]:blur-sm'>
                  <div className="absolute top-[calc(25%+40px)] aspect-square h-[calc(50%+40px)] max-lg:right-[calc(50%+40px)] lg:right-[50%]">
                    <div className="h-full w-full overflow-clip rounded-xl">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>
                  <div className="aspect-389/420 absolute inset-y-[25%] left-[50%] flex h-[50%] items-center justify-center max-lg:hidden">
                    <img
                      src={item.logo}
                      alt={item.company}
                      className="h-8 invert"
                    />
                  </div>
                  <div className="bg-accent absolute left-[50%] top-[50%] flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full max-lg:hidden">
                    <Plus className="text-accent-foreground size-8" />
                  </div>
                  <div className="bg-linear-to-t from-primary absolute inset-x-0 bottom-0 hidden h-[50%] from-50% to-transparent lg:block"></div>
                </div>
                <div className="relative flex flex-col justify-between gap-4 md:absolute md:inset-0 md:max-lg:inset-x-[50%] md:max-lg:w-[50%]">
                  <div className='flex h-[80px] items-center gap-2 p-4 transition-opacity delay-200 duration-500 lg:group-data-[state="closed"]:opacity-0'>
                    {item.badges?.map((badge, idx) => (
                      <Badge key={idx} variant="secondary">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className='delay-250 flex flex-col gap-2 p-4 transition-all delay-200 duration-500 lg:group-data-[state="closed"]:translate-y-4 lg:group-data-[state="closed"]:opacity-0'>
                    <div className="lg:hidden">
                      <img
                        src={item.logo}
                        alt={item.company}
                        className="h-5 invert lg:h-6"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-medium lg:text-lg">
                        {item.title}
                      </div>
                      <div className="bg-background text-foreground flex size-8 items-center justify-center rounded-full transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 lg:size-10">
                        <ArrowUpRight className="size-4 lg:size-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export { Gallery1 };
