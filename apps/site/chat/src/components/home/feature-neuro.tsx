import { Brain, Database, Kanban, List, Lock, Mic, Shield } from "lucide-react";

import { Container } from "@/packages/components/misc/layout/Container";

const FeatureNeuro = () => {
  return (
    <section id="features" className="py-32">
      <Container>
        <div className="gap flex flex-col justify-center gap-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Наши возможности</h1>
          <p className="text-muted-foreground text-xl">
            Решение технических проблем создания цельных миров с помощью
            искусственного интеллекта
          </p>
        </div>
        <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 - Large: ИИ, который помнит всё */}
          <div className="bg-muted/70 flex flex-col justify-between gap-6 rounded-lg p-8 md:col-span-2 lg:row-span-2">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Database className="h-auto w-11 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                <Brain className="h-auto w-11 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
              </div>
              <h2 className="mb-1 text-2xl font-medium">
                ИИ, который помнит всё
              </h2>
              <p className="text-muted-foreground">
                Забудьте о галлюцинациях. Наша система использует Графовую Базу
                Знаний. Если персонаж А ненавидит персонажа Б в 5-й главе, ИИ
                не заставит их обниматься в 20-й.
              </p>
            </div>
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-aspect-video-1.svg"
              alt="Graph Knowledge Base"
              className="ml-auto max-h-80 w-full rounded-lg object-cover transition-transform duration-300 hover:-translate-y-3 sm:w-11/12"
            />
          </div>

          {/* Card 2 - Tall: Структурный подход */}
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <div className="mb-6 flex items-center gap-3">
              <Kanban className="h-auto w-11 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
              <List className="h-auto w-11 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="mb-1 text-2xl font-medium">
                Структурный подход
              </h2>
              <p className="text-muted-foreground">
                От Идеи до Синопсиса, от Эпизодного плана до Черновика.
                Канбан-доски и Гант встроены в процесс.
              </p>
            </div>
          </div>

          {/* Card 3 - Square: Ваши данные изолированы */}
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-auto w-11 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
              <Lock className="h-auto w-11 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="mb-1 text-2xl font-medium">
                Ваши данные изолированы
              </h2>
              <p className="text-muted-foreground">
                Полная Multi-tenant изоляция. Ваш мир принадлежит только вам.
                Никакого обучения общих моделей на ваших черновиках.
              </p>
            </div>
          </div>

          {/* Card 4 - Square: Диктовка со скоростью мысли */}
          <div className="bg-muted/70 flex h-80 flex-col justify-between gap-4 rounded-lg p-8">
            <Mic className="mb-6 h-auto w-11 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
            <div>
              <h2 className="mb-1 text-2xl font-medium">
                Диктовка со скоростью мысли
              </h2>
              <p className="text-muted-foreground">
                Интеграция Whisper (Groq) для мгновенного превращения голоса в
                художественный текст.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { FeatureNeuro };
