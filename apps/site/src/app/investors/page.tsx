"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, HandCoins, TrendingUp, Shield } from "lucide-react";
import Link from "next/link";
import {InvestorsFormData} from '@/shared/types/altrp'
import dynamic from "next/dynamic";
import type { Value as E164Number } from "react-phone-number-input";

const PhoneInput = dynamic(
  () => import("@/components/ui/phone-input").then((mod) => mod.PhoneInput),
  { ssr: false }
);

const steps = [
  {
    title: "Регистрация и верификация",
    description:
      "Заполните заявку на нашем сайте и пройдите процедуру верификации. Это займет всего несколько минут.",
    icon: Building2,
  },
  {
    title: "Выбор инвестиционного продукта",
    description:
      "Изучите доступные инвестиционные продукты и выберите подходящий вам по сумме, сроку и доходности.",
    icon: HandCoins,
  },
  {
    title: "Инвестирование",
    description:
      "Переведите средства на ваш инвестиционный счет. Мы обеспечиваем безопасность всех транзакций.",
    icon: TrendingUp,
  },
  {
    title: "Получение дохода",
    description:
      "Регулярно получайте доход от ваших инвестиций. Все выплаты производятся в соответствии с договором.",
    icon: Calendar,
  },
];

const products = [
  {
    id: "conservative",
    name: "Консервативный",
    minAmount: 100000,
    term: "6-12 месяцев",
    targetReturn: "8-12%",
    description: "Низкий риск, стабильный доход",
    features: [
      "Минимальная сумма: 100 000 ₽",
      "Срок: 6-12 месяцев",
      "Целевая доходность: 8-12% годовых",
      "Низкий уровень риска",
      "Регулярные выплаты",
    ],
  },
  {
    id: "balanced",
    name: "Сбалансированный",
    minAmount: 500000,
    term: "12-24 месяца",
    targetReturn: "12-18%",
    description: "Умеренный риск, сбалансированная доходность",
    features: [
      "Минимальная сумма: 500 000 ₽",
      "Срок: 12-24 месяца",
      "Целевая доходность: 12-18% годовых",
      "Умеренный уровень риска",
      "Ежемесячные выплаты",
    ],
  },
  {
    id: "aggressive",
    name: "Агрессивный",
    minAmount: 1000000,
    term: "24-36 месяцев",
    targetReturn: "18-25%",
    description: "Высокий потенциал доходности",
    features: [
      "Минимальная сумма: 1 000 000 ₽",
      "Срок: 24-36 месяцев",
      "Целевая доходность: 18-25% годовых",
      "Повышенный уровень риска",
      "Квартальные выплаты",
    ],
  },
];

export default function InvestorsPage() {
  const [formData, setFormData] = React.useState<InvestorsFormData>({
    name: "",
    phone: "",
    email: "",
  });
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/altrp/v1/investor-form", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Не удалось отправить заявку");
      }

      setStatus("success");
      setFormData({
        name: "",
        phone: "",
        email: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Неизвестная ошибка");
    }
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 pt-24 py-16 md:py-32">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Приумножайте капитал этично
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Целевая доходность 8-25% годовых на принципах партнерства и справедливости
          </p>
          <Button asChild size="lg" className="rounded-full text-base">
            <Link href="#application">Стать инвестором</Link>
          </Button>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Как это работает для инвестора
          </h2>
          <div className="relative ml-3">
            <div className="absolute left-0 top-4 bottom-0 border-l-2" />
            {steps.map((step, index) => (
              <div key={index} className="relative pl-8 pb-12 last:pb-0">
                <div className="absolute h-3 w-3 -translate-x-1/2 left-px top-3 rounded-full border-2 border-primary bg-background" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0 h-9 w-9 bg-accent rounded-full flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-base font-medium">Шаг {index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Products Section */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Инвестиционные продукты
          </h2>
          <Tabs defaultValue="conservative" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="conservative">Консервативный</TabsTrigger>
              <TabsTrigger value="balanced">Сбалансированный</TabsTrigger>
              <TabsTrigger value="aggressive">Агрессивный</TabsTrigger>
            </TabsList>
            {products.map((product) => (
              <TabsContent key={product.id} value={product.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Guarantees Section */}
      <section className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2 md:gap-12">
            <h2 className="text-4xl font-medium">Гарантии и риски</h2>
            <div className="space-y-6">
              <p>
                Мы минимизируем риски за счет диверсификации портфеля, тщательного отбора заемщиков
                и использования принципов исламского финансирования.
              </p>
              <p>
                <span className="font-bold">Все инвестиции застрахованы</span> — мы обеспечиваем
                защиту ваших средств через систему гарантий и резервных фондов.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application" className="py-16 md:py-32">
        <div className="mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>Оставьте заявку на консультацию</CardTitle>
              <CardDescription>
                Наш специалист свяжется с вами в течение 24 часов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <PhoneInput
                    defaultCountry="RU"
                    placeholder="+7 (999) 999-99-99"
                    value={(formData.phone || "") as E164Number}
                    onChange={(value) =>
                      setFormData({ ...formData, phone: value ?? "" })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {status === "success" && (
                  <p className="text-sm text-green-600" role="status">
                    Заявка отправлена! Мы свяжемся с вами в ближайшее время.
                  </p>
                )}
                {status === "error" && (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMessage ?? "Произошла ошибка при отправке заявки."}
                  </p>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={status === "loading"}>
                  {status === "loading" ? "Отправляем..." : "Отправить"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <FooterSection />
    </div>
  );
}

