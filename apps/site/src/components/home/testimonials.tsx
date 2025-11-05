'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Testimonials() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-4xl font-medium lg:text-5xl">Что говорят наши клиенты и партнеры</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
                    <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
                        <CardHeader>
                            <img
                                className="h-6 w-fit dark:invert"
                                src="/images/nike.svg"
                                alt="Partner Logo"
                                height="24"
                                width="auto"
                            />
                        </CardHeader>
                        <CardContent>
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-xl font-medium">
                                    Esnad Finance помог нам предложить нашим клиентам честную рассрочку без переплат. Это значительно увеличило наши продажи и улучшило удовлетворенность клиентов. Прозрачность и этичность - это именно то, чего не хватало на рынке.
                                </p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage
                                            src="/images/avatar-placeholder.svg"
                                            alt="Александр Петров"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>АП</AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <cite className="text-sm font-medium">Александр Петров</cite>
                                        <span className="text-muted-foreground block text-sm">Директор по продажам</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-xl font-medium">
                                    Инвестирую через Esnad Finance уже полгода. Платформа действительно прозрачная, все операции видны в личном кабинете. Доходность стабильная, а главное - я знаю, что мои деньги работают в реальном бизнесе.
                                </p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage
                                            src="/images/avatar-placeholder.svg"
                                            alt="Мария Иванова"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>МИ</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium">Мария Иванова</cite>
                                        <span className="text-muted-foreground block text-sm">Инвестор</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p>
                                    Купил ноутбук в рассрочку через Esnad Finance. Без скрытых комиссий, без переплат. Все честно и прозрачно. Одобрение получил за час, деньги перевели в магазин в тот же день.
                                </p>

                                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                                    <Avatar className="size-12">
                                        <AvatarImage
                                            src="/images/avatar-placeholder.svg"
                                            alt="Дмитрий Сидоров"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>ДС</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium">Дмитрий Сидоров</cite>
                                        <span className="text-muted-foreground block text-sm">Покупатель</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>

                    <Card className="card variant-mixed">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p>
                                    Работаем с Esnad Finance как партнеры уже год. Интеграция простая, выплаты стабильные. Клиенты довольны возможностью рассрочки, а мы - ростом среднего чека.
                                </p>

                                <div className="grid grid-cols-[auto_1fr] gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage
                                            src="/images/avatar-placeholder.svg"
                                            alt="Елена Козлова"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>ЕК</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">Елена Козлова</p>
                                        <span className="text-muted-foreground block text-sm">Партнер, менеджер по развитию</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

