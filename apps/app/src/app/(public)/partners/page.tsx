"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";
import { LogoCloud } from "@/components/home/logo-cloud";

const partners = [
  { name: "М.Видео", city: "Москва" },
  { name: "Эльдорадо", city: "Санкт-Петербург" },
  { name: "DNS", city: "Новосибирск" },
  { name: "Технопарк", city: "Екатеринбург" },
  { name: "Ситилинк", city: "Казань" },
  { name: "МТС", city: "Нижний Новгород" },
];

const benefits = [
  {
    icon: TrendingUp,
    title: "Увеличение продаж",
    description:
      "Привлекайте новую платежеспособную аудиторию и увеличивайте средний чек на 30-40%.",
  },
  {
    icon: Users,
    title: "Расширение клиентской базы",
    description:
      "Предлагайте рассрочку и привлекайте клиентов, которые не могут оплатить товар сразу.",
  },
  {
    icon: Shield,
    title: "Без рисков",
    description:
      "Мы берем на себя все риски по невыплатам. Вы получаете полную стоимость товара сразу.",
  },
  {
    icon: Store,
    title: "Простая интеграция",
    description:
      "Быстрое подключение к нашей системе. Минимальные требования к технической инфраструктуре.",
  },
];

export default function PartnersPage() {
  const [formData, setFormData] = React.useState({
    companyName: "",
    inn: "",
    contactName: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    console.log("Form submitted:", formData);
    alert("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 pt-24 py-16 md:py-32">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Увеличьте продажи с Altrp
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Привлекайте новую платежеспособную аудиторию и увеличивайте средний чек
          </p>
          <Button asChild size="lg" className="rounded-full text-base">
            <Link href="#application">Стать партнером</Link>
          </Button>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Наши партнеры
          </h2>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="list">Списком</TabsTrigger>
              <TabsTrigger value="map" disabled>
                На карте (скоро)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map((partner, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{partner.name}</CardTitle>
                      <CardDescription>{partner.city}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="map">
              <div className="h-[400px] flex items-center justify-center border rounded-lg">
                <p className="text-muted-foreground">Карта партнеров скоро появится</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">
            Преимущества для вашего бизнеса
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col border rounded-xl py-6 px-5"
              >
                <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                  <benefit.icon className="size-5" />
                </div>
                <span className="text-lg font-semibold">{benefit.title}</span>
                <p className="mt-1 text-foreground/80 text-[15px]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application" className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>Форма заявки на партнерство</CardTitle>
              <CardDescription>
                Заполните форму, и наш менеджер свяжется с вами в течение 24 часов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Название компании *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ООО «Пример»"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inn">ИНН *</Label>
                  <Input
                    id="inn"
                    type="text"
                    placeholder="1234567890"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Контактное лицо *</Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="Иван Иванов"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Отправить заявку
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

