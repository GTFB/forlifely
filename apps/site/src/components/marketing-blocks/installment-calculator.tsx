"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InstallmentCalculator() {
  const [productPrice, setProductPrice] = React.useState<string>("50000");
  const [term, setTerm] = React.useState<number[]>([6]);

  const price = parseFloat(productPrice) || 0;
  const months = term[0] || 6;
  const monthlyPayment = price > 0 && months > 0 ? Math.round(price / months) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Card>
          <CardHeader>
            <CardTitle>Рассчитайте вашу рассрочку</CardTitle>
            <CardDescription>Узнайте ежемесячный платеж за 30 секунд</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productPrice">Стоимость товара, ₽</Label>
              <Input
                id="productPrice"
                type="number"
                placeholder="Например: 50000"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
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
                value={term}
                onValueChange={setTerm}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3</span>
                <span>24</span>
              </div>
            </div>

            {monthlyPayment > 0 && (
              <div className="rounded-lg border bg-muted/50 p-6">
                <p className="text-sm text-muted-foreground mb-2">Ежемесячный платеж:</p>
                <p className="text-4xl font-bold">{formatCurrency(monthlyPayment)}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" size="lg">
              <Link href="/consumers">Подать заявку</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

