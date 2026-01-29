import { Button } from "@/components/ui/button";
import { Container } from "@/packages/components/misc/layout/Container";

const Cta14 = () => {
  return (
    <section className="py-32">
      <Container>
        <div className="flex h-[620px] items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0)),url('https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/pawel-czerwinski-O4fAgtXLRwI-unsplash.jpg')] bg-cover bg-center">
          <div className="flex flex-col gap-8 p-4 text-center">
            <h2 className="text-primary-foreground text-5xl font-bold">
              Ваша книга готова к написанию
            </h2>
            <p className="text-primary-foreground text-lg">
              Присоединяйтесь к закрытому бета-тестированию и получите 1 миллион
              токенов в подарок. Начните создавать свой бестселлер уже сегодня.
            </p>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button size="lg" variant="default" asChild>
                <a href="#pricing">Запросить доступ</a>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="#features">Узнать больше</a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { Cta14 };
