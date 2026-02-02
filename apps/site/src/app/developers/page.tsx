import DevelopersHeroSection from '@/components/developers/hero-section'
import DevelopersFeaturesSection from '@/components/developers/features-section'
import WhyOnlyTestSection from '@/components/developers/why-onlytest-section'
import FooterSection from '@/components/marketing-blocks/footer'
import { HeroHeader } from '@/components/home/header'

export const metadata = {
    title: 'Для разработчиков | OnlyTest',
    description: 'Платформа для тестирования игр. Проводите FGT и CBT с качественным фидбеком от реальных игроков.',
}

export default function DevelopersPage() {
    return (
        <div className="flex-1">
            <HeroHeader />
            <DevelopersHeroSection />
            <DevelopersFeaturesSection />
            <WhyOnlyTestSection />
            <FooterSection />
        </div>
    )
}
