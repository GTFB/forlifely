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
import { altrpText } from "@/shared/types/altrp";
import { formatDate } from "@/shared/utils/date-format";


export default function BlogPageComponent({
  blogPosts,
  categories,
}: {
  blogPosts: altrpText[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = React.useState("Все");

  const filteredPosts =
    selectedCategory === "Все"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="flex-1">
      <HeroHeader />
      <div className="max-w-7xl mx-auto pt-24 py-16 px-6">
        <div className="flex items-end justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">
            Блог Altrp
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
            <Link key={post.id} href={`/blog/${post.dataIn?.slug}`}>
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
                    {post.content 
                      ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                      : 'Нет описания'}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-muted"></div>
                      <span className="text-muted-foreground font-medium text-sm">
                        Altrp
                      </span>
                    </div>

                    <span className="text-muted-foreground text-sm">
                      {post.createdAt ? formatDate(post.createdAt) : ''}
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

