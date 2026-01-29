"use client";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/packages/components/misc/layout/Container";

interface DataItem {
  title: string;
  description: string;
  badges: string[];
  features: { text: string; description: string }[];
  timeEstimate: string;
  priceEstimate: string;
  isHighlighted?: boolean;
}

const Pricing26 = () => {
  const DATA: DataItem[] = [
    {
      title: "Novice (Автор)",
      description:
        "Идеально для начинающих авторов. Создавайте свою первую книгу с базовыми возможностями RAG и доступом к Gemini Flash.",
      badges: ["1 Проект", "Базовый RAG"],
      features: [
        { text: "Проекты", description: "1 Книга" },
        { text: "RAG", description: "Базовый" },
        { text: "Модель", description: "Gemini Flash" },
        { text: "Цена", description: "Бесплатно / $9 мес." },
      ],
      timeEstimate: "",
      priceEstimate: "Бесплатно / $9 мес.",
    },
    {
      title: "Pro Author",
      description:
        "Для профессиональных авторов. Безлимитные проекты, умный RAG с Gemini Pro 1.5, голосовой ввод и экспорт в различные форматы.",
      badges: ["Безлимит", "Gemini Pro", "Голосовой ввод"],
      features: [
        { text: "Проекты", description: "Безлимит" },
        { text: "RAG", description: "Умный (Gemini Pro 1.5)" },
        { text: "Голосовой ввод", description: "Groq Whisper" },
        { text: "Экспорт", description: ".docx / .epub" },
        { text: "Цена", description: "$29 мес." },
      ],
      timeEstimate: "",
      priceEstimate: "$29 мес.",
      isHighlighted: true,
    },
    {
      title: "Publisher (Издательство)",
      description:
        "Комплексное решение для издательств. Командная работа, аналитика рынка Trendwatcher и приоритетная очередь генерации.",
      badges: ["Команда", "Trendwatcher", "Приоритет"],
      features: [
        { text: "Команда", description: "Co-Authors, Editors" },
        { text: "Аналитика", description: "Trendwatcher" },
        { text: "Очередь", description: "Приоритетная" },
        { text: "Поддержка", description: "24/7" },
        { text: "Цена", description: "$99 мес. / Custom" },
      ],
      timeEstimate: "",
      priceEstimate: "$99 мес. / Custom",
    },
  ];

  return (
    <section id="pricing" className="bg-muted py-32">
      <Container>
        <h1 className="mb-4 text-2xl md:text-3xl lg:mb-8 lg:text-4xl">
          Тарифы
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {DATA.map((pkg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-1 flex-col rounded-3xl p-6 lg:py-8",
                pkg.isHighlighted ? "bg-amber-200" : "bg-background",
              )}
            >
              {/* Badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                {pkg.badges.map((badgeText, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      "rounded-sm border bg-transparent px-4 py-2 text-black",
                      pkg.isHighlighted ? "border-black" : "border-secondary",
                    )}
                  >
                    {badgeText}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h2 className="mb-2 mt-24 text-base font-medium lg:text-2xl">
                {pkg.title}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground mb-6 text-sm">
                {pkg.description}
              </p>

              {/* Features */}
              <div className="mb-6 flex-1">
                {pkg.features.map((feature, i) => (
                  <div
                    key={i}
                    className={cn(
                      "py-4",
                      i === 0 &&
                        "border-muted-foreground border-t border-dashed",
                      i !== pkg.features.length - 1 &&
                        "border-muted-foreground border-b border-dashed",
                    )}
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {feature.text}
                      </span>
                      <span className="text-sm">{feature.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Button */}
              <Button className="mt-auto w-full py-6">Начать</Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export { Pricing26 };
