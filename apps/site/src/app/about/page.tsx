"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import ContentSection from "@/components/marketing-blocks/content04";
import { Shield, Users, Zap, Heart } from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const values = [
  {
    icon: Shield,
    title: "Прозрачность",
    description:
      "Мы ведем открытую политику и предоставляем полную информацию о наших условиях и процессах.",
  },
  {
    icon: Heart,
    title: "Партнерство",
    description:
      "Строим долгосрочные отношения с клиентами, инвесторами и партнерами на основе взаимного уважения.",
  },
  {
    icon: Zap,
    title: "Технологичность",
    description:
      "Используем современные технологии для обеспечения быстрого и удобного сервиса.",
  },
  {
    icon: Users,
    title: "Ответственность",
    description:
      "Несем ответственность за каждый проект и гарантируем выполнение обязательств.",
  },
];

const teamMembers = [
  {
    name: "Иван Иванов",
    title: "Генеральный директор",
    imageUrl:
      "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Мария Петрова",
    title: "Финансовый директор",
    imageUrl:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Алексей Сидоров",
    title: "Директор по развитию",
    imageUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    name: "Елена Козлова",
    title: "Руководитель клиентского сервиса",
    imageUrl:
      "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

const legalInfo = [
  {
    title: "Реквизиты",
    content: (
      <div className="space-y-2 text-muted-foreground">
        <p>ООО "Эснад Финанс"</p>
        <p>ИНН: 1234567890</p>
        <p>КПП: 123456789</p>
        <p>ОГРН: 1234567890123</p>
        <p>Адрес: г. Москва, ул. Примерная, д. 1</p>
      </div>
    ),
  },
  {
    title: "Лицензии",
    content: (
      <div className="space-y-2 text-muted-foreground">
        <p>Лицензия на осуществление микрофинансовой деятельности №12345678901234567</p>
        <p>Выдана: Центральным банком Российской Федерации</p>
        <p>Дата выдачи: 01.01.2020</p>
      </div>
    ),
  },
  {
    title: "Политика конфиденциальности",
    content: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Мы обязуемся защищать вашу личную информацию в соответствии с требованиями законодательства РФ.
        </p>
        <p>
          Все данные обрабатываются в соответствии с Федеральным законом "О персональных данных" №152-ФЗ.
        </p>
        <p>
          <a href="/privacy" className="text-primary underline">
            Подробнее о политике конфиденциальности
          </a>
        </p>
      </div>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="flex-1">
      <HeroHeader />
      {/* Mission Section */}
      <section className="pt-24 py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-4xl md:text-5xl font-medium mb-8">О Esnad Finance</h1>
          <div className="grid gap-6 md:grid-cols-2 md:gap-12">
            <blockquote className="text-2xl md:text-3xl font-medium border-l-4 border-primary pl-6">
              Наша миссия — сделать финансовые услуги доступными, прозрачными и этичными для всех.
            </blockquote>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Esnad Finance — это финансовая платформа, работающая по принципам исламского финансирования.
                Мы предлагаем рассрочку без процентов и инвестиционные продукты, соответствующие нормам Шариата.
              </p>
              <p className="text-muted-foreground">
                Мы верим, что финансы должны служить людям, а не наоборот. Поэтому мы строим нашу работу
                на принципах справедливости, прозрачности и взаимной выгоды.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12">Наши принципы</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col border rounded-xl py-6 px-5"
              >
                <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                  <value.icon className="size-5" />
                </div>
                <span className="text-lg font-semibold">{value.title}</span>
                <p className="mt-1 text-foreground/80 text-[15px]">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter mb-4">
              Ключевые лица
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Наша команда состоит из опытных профессионалов, которые разделяют наши ценности и стремятся
              к достижению общих целей.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  className="h-20 w-20 rounded-full object-cover mx-auto bg-secondary"
                  width={120}
                  height={120}
                />
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Information Section */}
      <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8">Реквизиты и документы</h2>
          <Accordion type="multiple" className="w-full">
            {legalInfo.map((item, index) => (
              <AccordionItem key={item.title} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-base">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <FooterSection />
    </div>
  );
}

