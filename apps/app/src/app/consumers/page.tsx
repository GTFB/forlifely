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
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { Value as E164Number } from "react-phone-number-input";

const PhoneInput = dynamic(
  () => import("@/components/ui/phone-input").then((mod) => mod.PhoneInput),
  { ssr: false }
);

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

// Helper function for month word declension
function getMonthWord(months: number): string {
  const lastDigit = months % 10;
  const lastTwoDigits = months % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "месяцев";
  }

  if (lastDigit === 1) {
    return "месяц";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "месяца";
  }

  return "месяцев";
}

const MIN_PRICE = 3000;
const MAX_PRICE = 300000;

const getInitialFormState = () => {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    productPrice: "50000",
    term: [6] as number[],
  };
};

export default function ConsumersPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = React.useState(getInitialFormState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPriceFocused, setIsPriceFocused] = React.useState(false);
  const priceInputRef = React.useRef<HTMLInputElement>(null);
  const [firstNameError, setFirstNameError] = React.useState<string | null>(null);
  const [lastNameError, setLastNameError] = React.useState<string | null>(null);

  // Read query params on mount and update form
  React.useEffect(() => {
    const productPriceParam = searchParams.get("productPrice");
    const termParam = searchParams.get("term");

    if (productPriceParam || termParam) {
      setFormData((prev) => ({
        ...prev,
        ...(productPriceParam && { productPrice: productPriceParam }),
        ...(termParam && { term: [Math.max(3, Math.min(24, parseInt(termParam, 10)))] }),
      }));
    }

    // Scroll to application section if hash is present
    if (typeof window !== "undefined" && window.location.hash === "#application") {
      setTimeout(() => {
        const element = document.getElementById("application");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams]);

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

  // Format price input (remove non-digits, clamp)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    
    // Remove all spaces and non-digits to get raw number
    const rawValue = input.value.replace(/\s/g, "").replace(/\D/g, "");
    
    // Calculate new cursor position after formatting
    // Count digits before cursor in original value
    const beforeCursor = input.value.substring(0, cursorPosition);
    const digitsBeforeCursor = beforeCursor.replace(/\s/g, "").replace(/\D/g, "").length;
    
    setFormData({ ...formData, productPrice: rawValue });
    
    // Restore cursor position after formatting
    if (rawValue) {
      setTimeout(() => {
        if (priceInputRef.current && isPriceFocused) {
          const formatted = parseFloat(rawValue).toLocaleString("ru-RU");
          // Find position in formatted string that corresponds to digitsBeforeCursor
          let newPosition = 0;
          let digitCount = 0;
          for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
            if (/\d/.test(formatted[i])) {
              digitCount++;
            }
            newPosition = i + 1;
          }
          priceInputRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // Clamp price on blur
  const handlePriceBlur = () => {
    setIsPriceFocused(false);
    if (formData.productPrice) {
      const numValue = parseFloat(formData.productPrice);
      if (!isNaN(numValue)) {
        const clamped = Math.max(MIN_PRICE, Math.min(MAX_PRICE, numValue));
        setFormData({ ...formData, productPrice: clamped.toString() });
      }
    }
  };

  // Handle focus
  const handlePriceFocus = () => {
    setIsPriceFocused(true);
  };

  // Get display value for price input - always show formatted with spaces
  const getPriceDisplayValue = () => {
    if (!formData.productPrice) return "";
    const numValue = parseFloat(formData.productPrice);
    if (isNaN(numValue)) return formData.productPrice;
    // Always show formatted value with spaces (e.g., "123 000")
    return numValue.toLocaleString("ru-RU");
  };

  // Validate Cyrillic characters
  const cyrillicRegex = /^[А-Яа-яЁё\s-]*$/;

  // Handle first name change with validation
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, firstName: value });
    
    // Validate on change
    if (value && !cyrillicRegex.test(value)) {
      setFirstNameError("Имя должно содержать только кириллические символы");
    } else {
      setFirstNameError(null);
    }
  };

  // Handle last name change with validation
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, lastName: value });
    
    // Validate on change
    if (value && !cyrillicRegex.test(value)) {
      setLastNameError("Фамилия должна содержать только кириллические символы");
    } else {
      setLastNameError(null);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const firstNameValid = !formData.firstName || cyrillicRegex.test(formData.firstName);
    const lastNameValid = !formData.lastName || cyrillicRegex.test(formData.lastName);
    return firstNameValid && lastNameValid && 
           formData.firstName.trim() !== "" && 
           formData.lastName.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submit
    const firstNameValid = !formData.firstName || cyrillicRegex.test(formData.firstName);
    const lastNameValid = !formData.lastName || cyrillicRegex.test(formData.lastName);

    if (!firstNameValid) {
      setFirstNameError("Имя должно содержать только кириллические символы");
    }
    if (!lastNameValid) {
      setLastNameError("Фамилия должна содержать только кириллические символы");
    }

    if (!firstNameValid || !lastNameValid) {
      setFeedback({
        type: "error",
        message: "Пожалуйста, исправьте ошибки в форме перед отправкой",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/altrp/v1/consumers-form", {
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
        const errorMessage = result?.message ?? "Не удалось отправить заявку";
        
        // Check if error is about Cyrillic validation
        if (errorMessage.includes("кириллические символы") || errorMessage.includes("Имя") || errorMessage.includes("Фамилия")) {
          if (errorMessage.includes("Имя")) {
            setFirstNameError("Имя должно содержать только кириллические символы");
          }
          if (errorMessage.includes("Фамилия")) {
            setLastNameError("Фамилия должна содержать только кириллические символы");
          }
        }
        
        throw new Error(errorMessage);
      }

      setFeedback({
        type: "success",
        message: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.",
      });
      setFormData(getInitialFormState());
      setFirstNameError(null);
      setLastNameError(null);
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
                      onChange={handleFirstNameChange}
                      className={firstNameError ? "border-destructive" : ""}
                      aria-invalid={!!firstNameError}
                      aria-describedby={firstNameError ? "firstName-error" : undefined}
                      required
                    />
                    {firstNameError && (
                      <p id="firstName-error" className="text-xs text-destructive">
                        {firstNameError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Иванов"
                      value={formData.lastName}
                      onChange={handleLastNameChange}
                      className={lastNameError ? "border-destructive" : ""}
                      aria-invalid={!!lastNameError}
                      aria-describedby={lastNameError ? "lastName-error" : undefined}
                      required
                    />
                    {lastNameError && (
                      <p id="lastName-error" className="text-xs text-destructive">
                        {lastNameError}
                      </p>
                    )}
                  </div>
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
                    hideCountrySelector
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="productPrice">Стоимость товара</Label>
                    <span className="text-xs text-muted-foreground">
                      от {MIN_PRICE.toLocaleString("ru-RU")} до {MAX_PRICE.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <Input
                    ref={priceInputRef}
                    id="productPrice"
                    type="text"
                    inputMode="numeric"
                    placeholder="Например: 50000"
                    value={getPriceDisplayValue()}
                    onChange={handlePriceChange}
                    onFocus={handlePriceFocus}
                    onBlur={handlePriceBlur}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="term">Срок</Label>
                    <span className="text-sm font-medium">
                      {months} {getMonthWord(months)}
                    </span>
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
                    <span>3 {getMonthWord(3)}</span>
                    <span>24 {getMonthWord(24)}</span>
                  </div>
                </div>

                {monthlyPayment > 0 && (
                  <div className="rounded-lg border bg-muted/50 p-6 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ежемесячный платеж:
                      </p>
                      <p className="text-4xl font-bold">
                        {formatCurrency(monthlyPayment)}
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        Сумма к выплате:
                      </p>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(price)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Расчёт предварительный
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? "Отправляем..." : "Подать заявку"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-16 md:py-32">
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

