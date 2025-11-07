"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    console.log("Form submitted:", formData);
    alert("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 py-12">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Контакты
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Наша команда всегда готова помочь вам
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full mb-4">
                <MailIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 font-semibold text-xl mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Напишите нам на почту
              </p>
              <Link
                className="font-medium text-primary hover:underline"
                href="mailto:info@esnadfinance.ru"
              >
                info@esnadfinance.ru
              </Link>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full mb-4">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 font-semibold text-xl mb-2">Телефон</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Пн-Пт с 9:00 до 18:00
              </p>
              <Link
                className="font-medium text-primary hover:underline"
                href="tel:+78001234567"
              >
                +7 (800) 123-45-67
              </Link>
            </div>

            <div className="text-center flex flex-col items-center md:col-span-2 lg:col-span-1">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full mb-4">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 font-semibold text-xl mb-2">Офис</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Приходите к нам в офис
              </p>
              <Link
                className="font-medium text-primary hover:underline text-center"
                href="https://yandex.ru/maps"
                target="_blank"
                rel="noopener noreferrer"
              >
                г. Москва, ул. Примерная, д. 1
              </Link>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Напишите нам</CardTitle>
              <CardDescription>
                Заполните форму, и мы свяжемся с вами в ближайшее время
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
                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение *</Label>
                  <Textarea
                    id="message"
                    placeholder="Ваше сообщение..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Отправить
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}

