import { HeroHeader } from "@/components/home/header"
import TestersHeroSection from "@/components/testers/hero-section"
import HowToBecomeSection from "@/components/testers/how-to-become-section"
import BenefitsSection from "@/components/home/benefits-section"
import FooterSection from "@/components/marketing-blocks/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Gamepad2, ArrowRight } from "lucide-react"

export const metadata = {
    title: 'Для тестировщиков | OnlyTest',
    description: 'Стань тестировщиком игр. Играй в новинки раньше всех и получай награды за качественные отчеты.',
}

export default function TestersPage() {
    return (
        <div className="flex-1">
            <HeroHeader />
            <TestersHeroSection />
            <HowToBecomeSection />
            <BenefitsSection />
            
            {/* Open Games Preview Section */}
            <section className="px-4 py-16 md:py-32 bg-muted/30">
                <div className="mx-auto max-w-6xl space-y-8">
                    <div className="text-center">
                        <h2 className="font-heading text-balance text-4xl font-semibold lg:text-5xl">
                            Открытые игры для тестирования
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                            Уже сейчас доступны игры для тестирования. Присоединяйся и начинай зарабатывать!
                        </p>
                    </div>

                    <Card className="border-2">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                                        <Gamepad2 className="size-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-1">Игры ждут тестеров</h3>
                                        <p className="text-muted-foreground">
                                            Посмотри список доступных игр и выбери ту, которая тебе интересна
                                        </p>
                                    </div>
                                </div>
                                <Button asChild size="lg" className="rounded-lg">
                                    <Link href="/games">
                                        Посмотреть игры
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 py-16 md:py-32">
                <div className="mx-auto max-w-4xl text-center space-y-8">
                    <h2 className="font-heading text-balance text-4xl font-semibold lg:text-5xl">
                        Готов начать?
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Присоединяйся к сообществу тестировщиков и получай доступ к новинкам игровой индустрии
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="rounded-lg">
                            <Link href="/register?role=tester">Стать тестером</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="rounded-lg">
                            <Link href="/games">Посмотреть игры</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    )
}
