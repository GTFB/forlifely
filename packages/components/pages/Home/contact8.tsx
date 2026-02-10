"use client";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE = "Stay informed. Stay up to date with us.";
const DESCRIPTION =
  "Subscribe now to get the latest info, updates, news, offers, and announcements about Lifely and how we are making support for diabetes even better. ";
const DESCRIPTION_BOLD = "We'd love to have you in our family.";
const REQUIRED_NOTE = "indicates a required field";
const LABEL_FIRST_NAME = "First name";
const LABEL_LAST_NAME = "Last name";
const LABEL_EMAIL = "Email";
const BUTTON_LABEL = "Sign up";
const DISCLAIMER = "You can opt out any time after subscribing.";

interface Contact8Props {
  className?: string;
}

const Contact8 = ({ className }: Contact8Props) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <section className={cn("bg-purple-100 py-32", className)}>
      <Container>
        <div className="grid w-full gap-8 md:grid-cols-2">
          <img
            src="/images/5.jpg"
            alt=""
            className="min-h-[280px] w-full rounded-lg object-cover object-center md:min-h-0 md:h-full"
          />
          <div className="rounded-lg border bg-background p-8 shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {TITLE}
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              {DESCRIPTION}
              <span className="font-semibold text-foreground">{DESCRIPTION_BOLD}</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="text-destructive">*</span> {REQUIRED_NOTE}
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="contact8-first-name"
                    className="text-base font-medium"
                  >
                    {LABEL_FIRST_NAME} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact8-first-name"
                    name="firstName"
                    type="text"
                    required
                    placeholder=""
                    className="h-12 w-full text-base md:h-14 md:text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="contact8-last-name"
                    className="text-base font-medium"
                  >
                    {LABEL_LAST_NAME} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact8-last-name"
                    name="lastName"
                    type="text"
                    required
                    placeholder=""
                    className="h-12 w-full text-base md:h-14 md:text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="contact8-email"
                  className="text-base font-medium"
                >
                  {LABEL_EMAIL} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact8-email"
                  name="email"
                  type="email"
                  required
                  placeholder=""
                  className="h-12 w-full text-base md:h-14 md:text-lg"
                />
              </div>
              <Button
                type="submit"
                className="h-12 rounded-full px-8 text-base md:h-14 md:px-10 md:text-lg"
              >
                {BUTTON_LABEL}
              </Button>
              <p className="text-sm text-muted-foreground">{DISCLAIMER}</p>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { Contact8 };
