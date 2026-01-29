// This template requires the Embla Auto Scroll plugin to be installed:
//
// npm install embla-carousel-auto-scroll

"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Container } from "@/packages/components/misc/layout/Container";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Powered by state-of-the-art technology:",
  logos = [
    {
      id: "logo-1",
      description: "Google Gemini",
      image: "",
      className: "h-7 w-auto",
      text: "Google Gemini",
    },
    {
      id: "logo-2",
      description: "Groq",
      image: "",
      className: "h-7 w-auto",
      text: "Groq",
    },
    {
      id: "logo-3",
      description: "PostgreSQL",
      image: "",
      className: "h-7 w-auto",
      text: "PostgreSQL",
    },
    {
      id: "logo-4",
      description: "Bun",
      image: "",
      className: "h-7 w-auto",
      text: "Bun",
    },
    {
      id: "logo-5",
      description: "OpenAI",
      image: "",
      className: "h-7 w-auto",
      text: "OpenAI",
    },
  ],
}: Logos3Props & { logos?: (Logo & { text?: string })[] }) => {
  return (
    <section className="py-64">
      <Container className="flex flex-col items-center text-center">
        <h1 className="my-6 text-pretty text-2xl font-bold lg:text-4xl">
          {heading}
        </h1>
      </Container>
      <div className="pt-10 md:pt-16 lg:pt-20">
        <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-10 flex shrink-0 items-center justify-center">
                    <div>
                      {logo.image ? (
                        <img
                          src={logo.image}
                          alt={logo.description}
                          className={logo.className}
                        />
                      ) : (
                        <span className="text-foreground text-lg font-semibold">
                          {(logo as Logo & { text?: string }).text || logo.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-12 to-transparent"></div>
          <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-12 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
