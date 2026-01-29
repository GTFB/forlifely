import { ArrowRight, Search, FileSearch, Sparkles } from "lucide-react";

import { Container } from "@/packages/components/misc/layout/Container";

const TechnologyRag = () => {
  return (
    <section id="technology" className="bg-muted/60 py-32">
      <Container>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-20">
          {/* Left side - Text content */}
          <div className="flex-1">
            <h1 className="mb-6 text-4xl font-semibold md:text-5xl">
              Как работает динамический контекст?
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              В отличие от обычных чат-ботов, NeuroPublisher не скармливает
              модели всю книгу целиком.
            </p>

            <div className="space-y-6">
              {/* Step 1: Поиск */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <Search className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Поиск</h3>
                  <p className="text-muted-foreground">
                    Мы векторизируем ваш запрос и находим релевантные фрагменты
                    в ЛОР-буке.
                  </p>
                </div>
              </div>

              {/* Step 2: Извлечение */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <FileSearch className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Извлечение</h3>
                  <p className="text-muted-foreground">
                    Находим в ЛОР-буке только релевантные факты (отношения,
                    локации, улики) через графовую базу знаний.
                  </p>
                </div>
              </div>

              {/* Step 3: Генерация */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Генерация</h3>
                  <p className="text-muted-foreground">
                    Google Gemini 1.5 Pro пишет сцену, опираясь на точные данные
                    из вашего мира, а не на общие знания.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Visual schema */}
          <div className="flex-1">
            <div className="relative rounded-xl bg-background p-8 shadow-lg">
              <div className="space-y-6">
                {/* Asset (Персонаж) */}
                <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
                  <div className="mb-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                    Asset (Персонаж)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Персонаж А: ненавидит персонажа Б
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Relation (Связь) */}
                <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
                  <div className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Relation (Связь)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Графовая связь: ненависть
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Prompt */}
                <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
                  <div className="mb-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                    Prompt + Context
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Запрос + извлеченные факты
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Результат */}
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <div className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
                    Результат
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Сцена с учетом контекста
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { TechnologyRag };
