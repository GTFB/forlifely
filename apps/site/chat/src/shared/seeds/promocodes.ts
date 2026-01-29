import type { SeedDefinition, SeedData } from './index'
import { generateAid } from '../generate-aid'

const seedMeta = {
  name: "Promocodes",
  versions: [
    {
      version: "1.0.0",
      description: "Initial promocodes seed data",
      created_at: "2025-01-15 12:00",
    },
  ],
}

type PromocodeTemplate = {
  code: string
  title: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  quantity: number
  description?: string
}

const promocodeTemplates: PromocodeTemplate[] = [
  {
    code: 'WELCOME10',
    title: '10% off your first order',
    discountType: 'percent',
    discountValue: 10,
    quantity: 100,
    description: '10% discount on your first order for new customers',
  },
  {
    code: 'FIRST50',
    title: '€50 off your first order',
    discountType: 'fixed',
    discountValue: 50,
    quantity: 50,
    description: '€50 discount on your first order from €200',
  },
  {
    code: 'WEEKEND15',
    title: '15% off on weekends',
    discountType: 'percent',
    discountValue: 15,
    quantity: 200,
    description: '15% discount on orders placed on weekends',
  },
  {
    code: 'BIRTHDAY20',
    title: '20% off on your birthday',
    discountType: 'percent',
    discountValue: 20,
    quantity: 1000,
    description: '20% discount on your birthday',
  },
  {
    code: 'DELIVERY20',
    title: '€20 off delivery',
    discountType: 'fixed',
    discountValue: 20,
    quantity: 1,
    description: '€20 discount on delivery for orders from €150',
  },
]

function generateSeedData(): SeedData {
  return {
    __meta__: seedMeta,
    outreaches: promocodeTemplates.map((template, index) => ({
      uuid: crypto.randomUUID(),
      oaid: generateAid('o'),
      title: JSON.stringify({ en: template.title }),
      strategy_type: 'promocode',
      mechanic_type: template.discountType,
      order: (index + 1) * 100,
      data_in: JSON.stringify({
        code: template.code,
        discountType: template.discountType,
        discountValue: template.discountValue,
        quantity: template.quantity,
        used: 0,
        description: template.description || '',
      }),
    })),
  }
}

export const promocodesSeed: SeedDefinition = {
  id: 'promocodes',
  meta: seedMeta,
  getData: generateSeedData,
}

