import { generateAid } from '../generate-aid'
import type { SeedDefinition, SeedData } from './index'

// Multilingual content type
type MultilingualContent = {
  en: string
  de: string
  es: string
  fr: string
  ua: string
}

// Article data template with multilingual support
type ArticleTemplate = {
  slug: string
  category: string
  image: string
  title: MultilingualContent
  excerpt: MultilingualContent
  content: MultilingualContent
  seoTitle: MultilingualContent
  seoDescription: MultilingualContent
  seoKeywords: MultilingualContent
  order: number
}

// Raw article data
const articleTemplates: ArticleTemplate[] = [
  // Marketing articles
  {
    slug: 'strategicheskiy-marketingovyy-konsalting',
    category: 'Marketing',
    image: 'marketing-consulting.jpg',
    title: {
      en: 'Strategic Marketing Consulting: Grow Your Business',
      de: 'Strategische Marketingberatung: Wachsen Sie Ihr Geschäft',
      es: 'Consultoría de Marketing Estratégico: Haga Crecer Su Negocio',
      fr: 'Conseil en Marketing Stratégique: Faites Croître Votre Entreprise',
      ua: 'Стратегический маркетинговый консалтинг: Развивайте свой бизнес',
    },
    excerpt: {
      en: 'Learn how strategic marketing consulting can transform your business and drive growth.',
      de: 'Erfahren Sie, wie strategische Marketingberatung Ihr Geschäft transformieren und Wachstum fördern kann.',
      es: 'Aprenda cómo la consultoría de marketing estratégico puede transformar su negocio e impulsar el crecimiento.',
      fr: 'Découvrez comment le conseil en marketing stratégique peut transformer votre entreprise et stimuler la croissance.',
      ua: 'Узнайте, как стратегический маркетинговый консалтинг может преобразовать ваш бизнес и стимулировать рост.',
    },
    content: {
      en: `# Strategic Marketing Consulting: Grow Your Business

Strategic marketing consulting helps businesses identify opportunities, develop effective strategies, and achieve sustainable growth.

## Key Benefits

- Market analysis and competitive positioning
- Development of marketing strategies
- Optimization of marketing processes
- Increased brand awareness and customer engagement

## Our Services

We offer comprehensive marketing consulting services tailored to your business needs.`,
      de: `# Strategische Marketingberatung: Wachsen Sie Ihr Geschäft

Strategische Marketingberatung hilft Unternehmen, Chancen zu identifizieren, effektive Strategien zu entwickeln und nachhaltiges Wachstum zu erreichen.`,
      es: `# Consultoría de Marketing Estratégico: Haga Crecer Su Negocio

La consultoría de marketing estratégico ayuda a las empresas a identificar oportunidades, desarrollar estrategias efectivas y lograr un crecimiento sostenible.`,
      fr: `# Conseil en Marketing Stratégique: Faites Croître Votre Entreprise

Le conseil en marketing stratégique aide les entreprises à identifier les opportunités, à développer des stratégies efficaces et à atteindre une croissance durable.`,
      ua: `# Стратегический маркетинговый консалтинг: Развивайте свой бизнес

Стратегический маркетинговый консалтинг помогает предприятиям выявлять возможности, разрабатывать эффективные стратегии и достигать устойчивого роста.

## Ключевые преимущества

- Анализ рынка и конкурентное позиционирование
- Разработка маркетинговых стратегий
- Оптимизация маркетинговых процессов
- Повышение узнаваемости бренда и вовлеченности клиентов

## Наши услуги

Мы предлагаем комплексные услуги маркетингового консалтинга, адаптированные к потребностям вашего бизнеса.`,
    },
    seoTitle: {
      en: 'Strategic Marketing Consulting: Grow Your Business',
      de: 'Strategische Marketingberatung: Wachsen Sie Ihr Geschäft',
      es: 'Consultoría de Marketing Estratégico: Haga Crecer Su Negocio',
      fr: 'Conseil en Marketing Stratégique: Faites Croître Votre Entreprise',
      ua: 'Стратегический маркетинговый консалтинг: Развивайте свой бизнес',
    },
    seoDescription: {
      en: 'Learn how strategic marketing consulting can transform your business and drive growth.',
      de: 'Erfahren Sie, wie strategische Marketingberatung Ihr Geschäft transformieren kann.',
      es: 'Aprenda cómo la consultoría de marketing estratégico puede transformar su negocio.',
      fr: 'Découvrez comment le conseil en marketing stratégique peut transformer votre entreprise.',
      ua: 'Узнайте, как стратегический маркетинговый консалтинг может преобразовать ваш бизнес и стимулировать рост.',
    },
    seoKeywords: {
      en: 'marketing consulting, strategic marketing, business growth, marketing strategy',
      de: 'Marketingberatung, strategisches Marketing, Geschäftswachstum',
      es: 'consultoría de marketing, marketing estratégico, crecimiento empresarial',
      fr: 'conseil en marketing, marketing stratégique, croissance de l\'entreprise',
      ua: 'маркетинговый консалтинг, стратегический маркетинг, рост бизнеса, маркетинговая стратегия',
    },
    order: 1,
  },
  {
    slug: 'premium-tovary-kachestvennye-produkty',
    category: 'Goods',
    image: 'premium-goods.jpg',
    title: {
      en: 'Premium Products: Quality Products for Your Needs',
      de: 'Premium-Produkte: Qualitätsprodukte für Ihre Bedürfnisse',
      es: 'Productos Premium: Productos de Calidad para Sus Necesidades',
      fr: 'Produits Premium: Produits de Qualité pour Vos Besoins',
      ua: 'Премиум товары: Качественные продукты для ваших нужд',
    },
    excerpt: {
      en: 'Explore our wide range of premium products and quality goods designed to meet your everyday needs.',
      de: 'Entdecken Sie unser breites Sortiment an Premium-Produkten und Qualitätswaren.',
      es: 'Explore nuestra amplia gama de productos premium y productos de calidad.',
      fr: 'Découvrez notre large gamme de produits premium et de produits de qualité.',
      ua: 'Изучите наш широкий ассортимент премиум товаров и качественных продуктов, разработанных для удовлетворения ваших повседневных потребностей.',
    },
    content: {
      en: `# Premium Products: Quality Products for Your Needs

We offer a wide selection of premium products designed to meet your everyday needs.

## Product Categories

- Construction materials
- Industrial supplies
- Quality goods for business and home

## Why Choose Us

- High quality standards
- Competitive prices
- Fast delivery
- Professional service`,
      de: `# Premium-Produkte: Qualitätsprodukte für Ihre Bedürfnisse

Wir bieten eine große Auswahl an Premium-Produkten, die auf Ihre täglichen Bedürfnisse zugeschnitten sind.`,
      es: `# Productos Premium: Productos de Calidad para Sus Necesidades

Ofrecemos una amplia selección de productos premium diseñados para satisfacer sus necesidades diarias.`,
      fr: `# Produits Premium: Produits de Qualité pour Vos Besoins

Nous offrons une large sélection de produits premium conçus pour répondre à vos besoins quotidiens.`,
      ua: `# Премиум товары: Качественные продукты для ваших нужд

Мы предлагаем широкий выбор премиум товаров, разработанных для удовлетворения ваших повседневных потребностей.

## Категории товаров

- Строительные материалы
- Промышленные поставки
- Качественные товары для бизнеса и дома

## Почему выбирают нас

- Высокие стандарты качества
- Конкурентные цены
- Быстрая доставка
- Профессиональный сервис`,
    },
    seoTitle: {
      en: 'Premium Products: Quality Products for Your Needs',
      de: 'Premium-Produkte: Qualitätsprodukte für Ihre Bedürfnisse',
      es: 'Productos Premium: Productos de Calidad para Sus Necesidades',
      fr: 'Produits Premium: Produits de Qualité pour Vos Besoins',
      ua: 'Премиум товары: Качественные продукты для ваших нужд',
    },
    seoDescription: {
      en: 'Explore our wide range of premium products and quality goods.',
      de: 'Entdecken Sie unser breites Sortiment an Premium-Produkten.',
      es: 'Explore nuestra amplia gama de productos premium.',
      fr: 'Découvrez notre large gamme de produits premium.',
      ua: 'Изучите наш широкий ассортимент премиум товаров и качественных продуктов, разработанных для удовлетворения ваших повседневных потребностей.',
    },
    seoKeywords: {
      en: 'premium products, quality goods, construction materials, industrial supplies',
      de: 'Premium-Produkte, Qualitätswaren, Baumaterialien',
      es: 'productos premium, productos de calidad, materiales de construcción',
      fr: 'produits premium, produits de qualité, matériaux de construction',
      ua: 'премиум товары, качественные продукты, строительные материалы, промышленные поставки',
    },
    order: 2,
  },
  {
    slug: 'svezhie-tsvety-krasivye-bukety',
    category: 'Flowers',
    image: 'fresh-flowers.jpg',
    title: {
      en: 'Fresh Flowers: Beautiful Bouquets for Any Occasion',
      de: 'Frische Blumen: Schöne Sträuße für Jeden Anlass',
      es: 'Flores Frescas: Hermosos Ramos para Cualquier Ocasión',
      fr: 'Fleurs Fraîches: Beaux Bouquets pour Toutes Occasions',
      ua: 'Свежие цветы: Красивые букеты на любой случай',
    },
    excerpt: {
      en: 'Discover our collection of fresh flowers and beautiful bouquets, perfect for any occasion.',
      de: 'Entdecken Sie unsere Kollektion frischer Blumen und schöner Sträuße.',
      es: 'Descubra nuestra colección de flores frescas y hermosos ramos.',
      fr: 'Découvrez notre collection de fleurs fraîches et de beaux bouquets.',
      ua: 'Откройте для себя нашу коллекцию свежих цветов и красивых букетов, идеально подходящих для любого случая.',
    },
    content: {
      en: `# Fresh Flowers: Beautiful Bouquets for Any Occasion

Our collection of fresh flowers includes beautiful bouquets for every occasion.

## Flower Varieties

- Roses
- Tulips
- Lilies
- Seasonal flowers from Altai region

## Services

- Custom bouquets
- Delivery service
- Fresh flowers guaranteed`,
      de: `# Frische Blumen: Schöne Sträuße für Jeden Anlass

Unsere Kollektion frischer Blumen umfasst schöne Sträuße für jeden Anlass.`,
      es: `# Flores Frescas: Hermosos Ramos para Cualquier Ocasión

Nuestra colección de flores frescas incluye hermosos ramos para cada ocasión.`,
      fr: `# Fleurs Fraîches: Beaux Bouquets pour Toutes Occasions

Notre collection de fleurs fraîches comprend de beaux bouquets pour toutes occasions.`,
      ua: `# Свежие цветы: Красивые букеты на любой случай

Наша коллекция свежих цветов включает красивые букеты для любого случая.

## Разновидности цветов

- Розы
- Тюльпаны
- Лилии
- Сезонные цветы из Алтайского края

## Услуги

- Индивидуальные букеты
- Служба доставки
- Гарантия свежести цветов`,
    },
    seoTitle: {
      en: 'Fresh Flowers: Beautiful Bouquets for Any Occasion',
      de: 'Frische Blumen: Schöne Sträuße für Jeden Anlass',
      es: 'Flores Frescas: Hermosos Ramos para Cualquier Ocasión',
      fr: 'Fleurs Fraîches: Beaux Bouquets pour Toutes Occasions',
      ua: 'Свежие цветы: Красивые букеты на любой случай',
    },
    seoDescription: {
      en: 'Discover our collection of fresh flowers and beautiful bouquets.',
      de: 'Entdecken Sie unsere Kollektion frischer Blumen.',
      es: 'Descubra nuestra colección de flores frescas.',
      fr: 'Découvrez notre collection de fleurs fraîches.',
      ua: 'Откройте для себя нашу коллекцию свежих цветов и красивых букетов, идеально подходящих для любого случая.',
    },
    seoKeywords: {
      en: 'fresh flowers, bouquets, flower delivery, roses, tulips',
      de: 'frische Blumen, Sträuße, Blumenlieferung',
      es: 'flores frescas, ramos, entrega de flores',
      fr: 'fleurs fraîches, bouquets, livraison de fleurs',
      ua: 'свежие цветы, букеты, доставка цветов, розы, тюльпаны',
    },
    order: 3,
  },
  {
    slug: 'aktsiya-besplatnoy-dostavki',
    category: 'Delivery',
    image: 'free-delivery.jpg',
    title: {
      en: 'Free Delivery Promotion: Special Offers',
      de: 'Kostenlose Lieferung Aktion: Sonderangebote',
      es: 'Promoción de Entrega Gratuita: Ofertas Especiales',
      fr: 'Promotion Livraison Gratuite: Offres Spéciales',
      ua: 'Акция бесплатной доставки: Специальные предложения',
    },
    excerpt: {
      en: 'Take advantage of our free delivery promotion and special offers on selected products.',
      de: 'Nutzen Sie unsere kostenlose Lieferung Aktion und Sonderangebote.',
      es: 'Aproveche nuestra promoción de entrega gratuita y ofertas especiales.',
      fr: 'Profitez de notre promotion de livraison gratuite et d\'offres spéciales.',
      ua: 'Воспользуйтесь нашей акцией бесплатной доставки и специальными предложениями на выбранные товары.',
    },
    content: {
      en: `# Free Delivery Promotion: Special Offers

Take advantage of our special promotion with free delivery on selected products.

## Promotion Details

- Free delivery on orders over a certain amount
- Special discounts on selected products
- Limited time offer

## How to Participate

- Add products to cart
- Check delivery options
- Enjoy free delivery!`,
      de: `# Kostenlose Lieferung Aktion: Sonderangebote

Nutzen Sie unsere Sonderaktion mit kostenloser Lieferung bei ausgewählten Produkten.`,
      es: `# Promoción de Entrega Gratuita: Ofertas Especiales

Aproveche nuestra promoción especial con entrega gratuita en productos seleccionados.`,
      fr: `# Promotion Livraison Gratuite: Offres Spéciales

Profitez de notre promotion spéciale avec livraison gratuite sur les produits sélectionnés.`,
      ua: `# Акция бесплатной доставки: Специальные предложения

Воспользуйтесь нашей специальной акцией с бесплатной доставкой на выбранные товары.

## Детали акции

- Бесплатная доставка при заказе на определенную сумму
- Специальные скидки на выбранные товары
- Ограниченное по времени предложение

## Как принять участие

- Добавьте товары в корзину
- Проверьте варианты доставки
- Наслаждайтесь бесплатной доставкой!`,
    },
    seoTitle: {
      en: 'Free Delivery Promotion: Special Offers',
      de: 'Kostenlose Lieferung Aktion: Sonderangebote',
      es: 'Promoción de Entrega Gratuita: Ofertas Especiales',
      fr: 'Promotion Livraison Gratuite: Offres Spéciales',
      ua: 'Акция бесплатной доставки: Специальные предложения',
    },
    seoDescription: {
      en: 'Take advantage of our free delivery promotion and special offers.',
      de: 'Nutzen Sie unsere kostenlose Lieferung Aktion.',
      es: 'Aproveche nuestra promoción de entrega gratuita.',
      fr: 'Profitez de notre promotion de livraison gratuite.',
      ua: 'Воспользуйтесь нашей акцией бесплатной доставки и специальными предложениями на выбранные товары.',
    },
    seoKeywords: {
      en: 'free delivery, promotion, special offers, discounts',
      de: 'kostenlose Lieferung, Aktion, Sonderangebote',
      es: 'entrega gratuita, promoción, ofertas especiales',
      fr: 'livraison gratuite, promotion, offres spéciales',
      ua: 'бесплатная доставка, акция, специальные предложения, скидки',
    },
    order: 4,
  },
]

// Meta information
const seedMeta: SeedDefinition['meta'] = {
  name: 'Marketplace News - Multilingual Articles',
  versions: [
    {
      version: '1.0.0',
      description: 'Initial seed with multilingual news articles about Marketing, Goods, Flowers, and Delivery promotions',
      created_at: '2025-01-29',
    },
  ],
}

// Function to generate seed data
function generateSeedData(): SeedData {
  return {
    __meta__: seedMeta,
    texts: articleTemplates.map((template) => ({
      uuid: crypto.randomUUID(),
      taid: generateAid('t'),
      // Store multilingual content as JSON string
      title: JSON.stringify(template.title),
      content: JSON.stringify(template.content),
      type: 'news',
      statusName: 'PUBLISHED',
      isPublic: true,
      order: template.order,
      data_in: JSON.stringify({
        slug: template.slug,
        image: template.image,
        excerpt: JSON.stringify(template.excerpt),
        seoTitle: JSON.stringify(template.seoTitle),
        seoDescription: JSON.stringify(template.seoDescription),
        seoKeywords: JSON.stringify(template.seoKeywords),
        category: template.category,
      }),
    })),
  }
}

// Seed definition
export const marketplaceNewsSeed: SeedDefinition = {
  id: 'marketplace-news',
  meta: seedMeta,
  getData: generateSeedData,
}

