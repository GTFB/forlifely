"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const blogPosts: Record<
  string,
  {
    title: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    content: React.ReactNode;
  }
> = {
  "kak-oformit-rassrochku": {
    title: "Как оформить рассрочку",
    category: "Финансы",
    author: "Иван Иванов",
    date: "2024-11-15",
    readTime: "5 мин",
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p>
          Рассрочка без процентов — это отличная возможность приобрести нужный товар, не переплачивая.
          В этой статье мы расскажем, как правильно оформить рассрочку и какие документы для этого нужны.
        </p>
        <h2>Шаг 1: Выбор товара и партнера</h2>
        <p>
          Первым делом вам нужно выбрать товар у одного из наших партнеров. Мы сотрудничаем с крупнейшими
          ритейлерами России, поэтому вы сможете найти практически любой товар.
        </p>
        <h2>Шаг 2: Подача заявки</h2>
        <p>
          Заполните онлайн-заявку на нашем сайте. Укажите сумму товара, желаемый срок рассрочки и свои
          контактные данные. Заявка рассматривается в течение 60 минут.
        </p>
        <h2>Шаг 3: Подготовка документов</h2>
        <p>Для оформления рассрочки вам понадобятся:</p>
        <ul>
          <li>Паспорт гражданина РФ</li>
          <li>Справка о доходах (2-НДФЛ или по форме банка)</li>
          <li>Трудовая книжка или договор</li>
          <li>СНИЛС</li>
        </ul>
        <h2>Шаг 4: Получение товара</h2>
        <p>
          После одобрения заявки вы сможете забрать товар у партнера. Рассрочка оформляется прямо в магазине,
          и вы сразу можете пользоваться покупкой.
        </p>
      </div>
    ),
  },
  "preimushchestva-rassrochki": {
    title: "Преимущества рассрочки",
    category: "Финансы",
    author: "Мария Петрова",
    date: "2024-11-10",
    readTime: "4 мин",
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p>
          Рассрочка — это удобный способ приобрести товар, разделив его стоимость на несколько платежей.
          В отличие от кредита, рассрочка не предполагает начисления процентов.
        </p>
        <h2>Основные преимущества</h2>
        <h3>Без процентов</h3>
        <p>
          Главное преимущество рассрочки — отсутствие переплаты. Вы платите ровно столько, сколько стоит товар,
          разделив сумму на удобные платежи.
        </p>
        <h3>Быстрое оформление</h3>
        <p>
          Заявка на рассрочку рассматривается в течение 60 минут. В большинстве случаев решение принимается
          автоматически, и вы сразу можете забрать товар.
        </p>
        <h3>Гибкие условия</h3>
        <p>
          Вы можете выбрать срок рассрочки от 3 до 24 месяцев, в зависимости от суммы покупки и ваших возможностей.
        </p>
      </div>
    ),
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.slug as string;
  const post = blogPosts[slug];

  const [copied, setCopied] = React.useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.origin + pathname : "";

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!post) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Статья не найдена</h1>
          <Link href="/blog">
            <Button variant="outline">Вернуться к блогу</Button>
          </Link>
        </div>
      </div>
    );
  }

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
      <article className="max-w-3xl mx-auto pt-24 py-16 px-6">
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              ← Назад к блогу
            </Button>
          </Link>
        </div>

        <header className="mb-8">
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">{post.category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>•</span>
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.readTime} чтения</span>
          </div>
        </header>

        <div className="mb-12">{post.content}</div>

        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Поделиться</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать ссылку
                </>
              )}
            </Button>
          </div>
        </div>
      </article>
      <FooterSection />
    </div>
  );
}

