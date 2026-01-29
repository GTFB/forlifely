import { systemSeed } from './system'
import { promocodesSeed } from './promocodes'
import { shippingSettingsSeed } from './shipping-settings'
import { mediaSeed } from './media-seed'
import { legalDocumentsSeed } from './legal-documents'
import { marketplaceProductsSeed } from './marketplace-products'
import { marketplaceNewsSeed } from './marketplace-news'

export type SeedMeta = {
  name: string
  versions: Array<{
    version: string
    description: string
    created_at: string
  }>
}

export type SeedData = {
  __meta__: SeedMeta
  [collection: string]: unknown
}

export type SeedDefinition = {
  id: string
  meta: SeedMeta
  getData: () => SeedData
}

export const seeds: SeedDefinition[] = [
  systemSeed,
  promocodesSeed,
  shippingSettingsSeed,
  mediaSeed,
  legalDocumentsSeed,
  marketplaceProductsSeed,
  marketplaceNewsSeed,
]


