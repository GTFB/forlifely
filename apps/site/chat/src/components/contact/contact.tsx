"use client";

import { useState } from "react";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RestaurantStatusBadge } from "@/components/ui/restaurant-status-badge";
import { Container } from "@/components/Container";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export function ContactSection() {
  const { locale } = useLocale();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(data.error || t("contacts.errorSending", locale));
      }

      // Success
      setSuccess(true);
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="py-12 lg:py-16">
      <Container>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{t("contacts.title", locale)}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("contacts.subtitle", locale)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.sendMessage", locale)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("contacts.formDescription", locale)}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-900 dark:text-green-100">
                    {t("contacts.messageSent", locale)}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("contacts.firstName", locale)}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder={t("contacts.firstName", locale)}
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("contacts.lastName", locale)}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder={t("contacts.lastName", locale)}
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("contacts.email", locale)}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("contacts.email", locale)}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("contacts.phone", locale)}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t("contacts.phone", locale)}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t("contacts.message", locale)}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t("contacts.message", locale)}
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("contacts.sending", locale) : t("contacts.sendMessageButton", locale)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("contacts.contactInformation", locale)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1">{t("contacts.email", locale)}</div>
                      <a 
                        href="mailto:info@payde.com" 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@payde.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1">{t("contacts.phone", locale)}</div>
                      <p className="text-sm text-muted-foreground">
                        {t("contacts.mondayFriday", locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1">{t("contacts.address", locale)}</div>
                      <p className="text-sm text-muted-foreground">
                        Unter den Linden 1<br />
                        10117 Berlin, Germany
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1">{t("contacts.workingHours", locale)}</div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{t("contacts.mondayFriday", locale)}</p>
                        <p>{t("contacts.saturday", locale)}</p>
                        <p>{t("contacts.sunday", locale)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
