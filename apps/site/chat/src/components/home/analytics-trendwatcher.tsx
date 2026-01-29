import { BarChart3, TrendingUp, ImageIcon } from "lucide-react";

import { Container } from "@/packages/components/misc/layout/Container";

const AnalyticsTrendwatcher = () => {
  return (
    <section className="py-32">
      <Container>
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">
            Пишите то, что читают
          </h1>
          <p className="text-lg text-muted-foreground">
            Встроенный модуль Trendwatcher анализирует рынок (Amazon/Author.today)
            и помогает создавать контент, который находит отклик у читателей.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Stat 1: Анализ популярных тропов */}
          <div className="bg-background rounded-lg border p-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <BarChart3 className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Анализ популярных тропов
            </h3>
            <p className="text-muted-foreground">
              Отслеживайте, какие темы и сюжетные линии набирают популярность
              на рынке прямо сейчас.
            </p>
          </div>

          {/* Stat 2: Прогноз читательского интереса */}
          <div className="bg-background rounded-lg border p-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Прогноз читательского интереса
            </h3>
            <p className="text-muted-foreground">
              Получайте предсказания о том, какие жанры и темы будут востребованы
              в ближайшие месяцы.
            </p>
          </div>

          {/* Stat 3: Генерация обложек и мета-тегов */}
          <div className="bg-background rounded-lg border p-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <ImageIcon className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Генерация обложек и мета-тегов
            </h3>
            <p className="text-muted-foreground">
              Автоматически создавайте обложки и SEO-оптимизированные мета-теги
              на основе трендов.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { AnalyticsTrendwatcher };
