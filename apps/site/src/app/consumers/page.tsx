"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, CheckCircle, Clock, Send } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const conditions = [
  { parameter: "Сумма", value: "от 3 000 до 300 000 ₽" },
  { parameter: "Срок", value: "от 3 до 24 месяцев" },
  { parameter: "Процентная ставка", value: "0% (без процентов)" },
  { parameter: "Возраст заемщика", value: "от 18 до 70 лет" },
  { parameter: "Гражданство", value: "Российская Федерация" },
  { parameter: "Требования к доходу", value: "Подтвержденный доход от 20 000 ₽/мес" },
  { parameter: "Решение", value: "в течение 60 минут" },
];

const documents = [
  "Паспорт гражданина РФ",
  "Справка о доходах (2-НДФЛ или по форме банка)",
  "Трудовая книжка или договор",
  "СНИЛС",
];

const steps = [
  {
    title: "Подайте заявку",
    description:
      "Заполните онлайн-заявку на нашем сайте. Это займет всего 5 минут. Укажите сумму, срок и данные о товаре.",
    icon: Send,
  },
  {
    title: "Получите решение",
    description:
      "Мы рассмотрим вашу заявку в течение 60 минут и сообщим результат. В большинстве случаев решение принимается автоматически.",
    icon: Clock,
  },
  {
    title: "Заберите товар",
    description:
      "После одобрения заявки вы сможете забрать товар у партнера. Рассрочка оформляется прямо в магазине.",
    icon: CheckCircle,
  },
];

const initialFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  productPrice: "50000",
  term: [6] as number[],
};

export default function ConsumersPage() {
  const [formData, setFormData] = React.useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const price = parseFloat(formData.productPrice) || 0;
  const months = formData.term[0] || 6;
  const monthlyPayment = price > 0 && months > 0 ? Math.round(price / months) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/esnad/v1/consumers-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          productPrice: formData.productPrice,
          term: formData.term,
        }),
      });

      const result = (await response.json().catch(() => ({
        success: false,
        message: "Не удалось обработать ответ сервера",
      }))) as { success: boolean; message?: string };

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Не удалось отправить заявку");
      }

      setFeedback({
        type: "success",
        message: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.",
      });
      setFormData({ ...initialFormState });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось отправить заявку. Попробуйте позже.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 pt-24 py-16 md:py-32">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Рассрочка по нормам Шариата
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Получите одобрение за 60 минут. Без процентов, без скрытых комиссий.
          </p>
          <Button asChild size="lg" className="rounded-full text-base">
            <Link href="#application">Подать заявку</Link>
          </Button>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application" className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>Заявка на рассрочку</CardTitle>
              <CardDescription>
                Заполните форму, и мы свяжемся с вами в течение 60 минут
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Иван"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Иванов"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productPrice">Стоимость товара, ₽</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    placeholder="Например: 50000"
                    value={formData.productPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, productPrice: e.target.value })
                    }
                    min="3000"
                    max="300000"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="term">Срок, мес.</Label>
                    <span className="text-sm font-medium">{months} месяцев</span>
                  </div>
                  <Slider
                    id="term"
                    min={3}
                    max={24}
                    step={1}
                    value={formData.term}
                    onValueChange={(value) =>
                      setFormData({ ...formData, term: value })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3</span>
                    <span>24</span>
                  </div>
                </div>

                {monthlyPayment > 0 && (
                  <div className="rounded-lg border bg-muted/50 p-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ежемесячный платеж:
                    </p>
                    <p className="text-4xl font-bold">
                      {formatCurrency(monthlyPayment)}
                    </p>
                  </div>
                )}

                {feedback && (
                  <div
                    className={`rounded-md border p-4 text-sm ${
                      feedback.type === "success"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {feedback.message}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Отправляем..." : "Подать заявку"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Conditions Section */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Условия в деталях
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Параметр</TableHead>
                    <TableHead>Значение</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conditions.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{condition.parameter}</TableCell>
                      <TableCell>{condition.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Необходимые документы
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Пошаговый процесс
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
      <FooterSection />
    </div>
  );
}

