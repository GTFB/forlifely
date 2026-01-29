import { ArrowRight, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Button } from "@/components/ui/button";

const HeroNeuro = () => {
  return (
    <section className="bg-background dark relative overflow-hidden h-screen font-sans flex items-center">
      <div className="container mx-auto relative z-20">
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8 px-4">
            <div className="max-w-[25rem] sm:max-w-[75rem]">
              <h1 className="text-foreground text-center text-4xl font-semibold leading-tight [text-shadow:0_4px_4px_rgba(0,0,0,0.15)] sm:text-5xl md:text-[4rem]">
                Напишите бестселлер за одну неделю. Без &quot;амнезии&quot;
                искусственного интеллекта.
              </h1>
            </div>
            <div className="max-w-[35rem] mb-10">
              <p className="text-foreground text-balance text-center text-sm leading-normal tracking-tight [text-shadow:0_4px_4px_rgba(0,0,0,0.25)] md:text-lg">
                Первая SaaS-платформа с RAG-архитектурой и Графовым ЛОР-буком.
                Мы решили проблему контекста, чтобы вы могли создавать цельные
                миры, а не разрозненные отрывки.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                className="inline-flex h-fit w-full items-center justify-center gap-2 text-nowrap rounded-lg border px-3 py-2 text-sm font-medium leading-snug tracking-tight sm:w-fit"
              >
                <a href="#pricing">Начать писать</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-linear-to-b inline-flex w-full items-center justify-center gap-2 text-nowrap rounded-lg border border-white/20 from-white/5 to-white/15 px-3 py-2 text-sm font-medium leading-snug tracking-tight text-white transition-colors hover:border-white/40 sm:w-fit"
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Play className="h-5 w-5" />
                  <span>Смотреть демо (YouTube)</span>
                </a>
              </Button>
            </div>
            <div className="text-muted-foreground flex gap-6 text-xs">
              <span>v1.0.0</span>
              <span className="relative before:absolute before:-left-3 before:content-['|']">
                Beta
              </span>
              <span className="relative before:absolute before:-left-3 before:content-['|']">
                <button>Запросить доступ</button>
              </span>
            </div>
          </div>
          <a
            href="#pricing"
            className="bg-background border-border/50 group relative mt-10 flex h-8 items-center gap-3 overflow-hidden rounded-full border px-3 py-1 text-sm font-medium text-white"
          >
            <span>Попробовать бесплатно</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <span>1 млн токенов</span>
              <ArrowRight className="stroke-muted-foreground h-4 w-4" />
            </span>
            <BorderBeam colorFrom="#fca5a5" colorTo="#ef4444" duration={3} />
          </a>
        </div>
      </div>
      <div className="absolute inset-0 z-10 before:absolute before:inset-0 before:size-full before:bg-[radial-gradient(circle_at_center,rgba(10,10,10,.5)_15%,rgba(10,10,10,1)_45%)] before:content-['']">
        <video
          src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/video-1.mp4"
          loop
          muted
          autoPlay
          controls={false}
          className="block h-full w-full object-cover object-center bg-blend-saturation"
        />
      </div>
    </section>
  );
};

export { HeroNeuro };
