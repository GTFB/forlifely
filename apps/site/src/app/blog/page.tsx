"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const blogPosts = [
  {
    id: "kak-oformit-rassrochku",
    title: "Как оформить рассрочку",
    category: "Финансы",
    excerpt: "Пошаговая инструкция по оформлению рассрочки без процентов. Узнайте, какие документы нужны и как быстро получить одобрение.",
    author: "Иван Иванов",
    date: "2025-11-15",
    image: "/images/blog-placeholder.jpg",
  },
  {
    id: "preimushchestva-rassrochki",
    title: "Преимущества рассрочки",
    category: "Финансы",
    excerpt: "Почему рассрочка выгоднее кредита? Разбираем основные преимущества и особенности рассрочки по нормам Шариата.",
    author: "Мария Петрова",
    date: "2025-11-10",
    image: "/images/blog-placeholder.jpg",
  },
  {
    id: "investirovanie-dlya-nachinayushchih",
    title: "Инвестирование для начинающих",
    category: "Инвестиции",
    excerpt: "С чего начать инвестирование? Основные принципы и правила для тех, кто только начинает свой путь инвестора.",
    author: "Алексей Сидоров",
    date: "2025-11-05",
    image: "/images/blog-placeholder.jpg",
  },
  {
    id: "islamskoe-finansirovanie",
    title: "Исламское финансирование: основы",
    category: "Образование",
    excerpt: "Что такое исламское финансирование и как оно работает? Разбираем основные принципы и отличия от традиционного банкинга.",
    author: "Елена Козлова",
    date: "2025-10-28",
    image: "/images/blog-placeholder.jpg",
  },
  {
    id: "kak-vybrat-investitsionnyy-produkt",
    title: "Как выбрать инвестиционный продукт",
    category: "Инвестиции",
    excerpt: "Руководство по выбору подходящего инвестиционного продукта. Учитываем ваши цели, сроки и готовность к риску.",
    author: "Иван Иванов",
    date: "2025-10-20",
    image: "/images/blog-placeholder.jpg",
  },
  {
    id: "bezopasnost-finansovykh-operatsiy",
    title: "Безопасность финансовых операций",
    category: "Безопасность",
    excerpt: "Как защитить свои средства при работе с финансовыми платформами. Основные правила безопасности и рекомендации.",
    author: "Мария Петрова",
    date: "2025-10-15",
    image: "/images/blog-placeholder.jpg",
  },
];

const categories = ["Все", "Финансы", "Инвестиции", "Образование", "Безопасность"];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("Все");

  const filteredPosts =
    selectedCategory === "Все"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      <div className="max-w-7xl mx-auto pt-24 py-16 px-6">
        <div className="flex items-end justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">
            Блог Esnad Finance
          </h1>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <Card className="shadow-none py-0 gap-3 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader className="p-2 pb-0">
                  <div className="aspect-video bg-muted rounded-lg w-full" />
                </CardHeader>
                <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col">
                  <Badge variant="secondary" className="w-fit">
                    {post.category}
                  </Badge>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-muted"></div>
                      <span className="text-muted-foreground font-medium text-sm">
                        {post.author}
                      </span>
                    </div>

                    <span className="text-muted-foreground text-sm">
                      {formatDate(post.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Статей в этой категории пока нет</p>
          </div>
        )}
      </div>
      <FooterSection />
    </div>
  );
}

