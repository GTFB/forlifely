import type { SeedDefinition, SeedData } from './index'

const _shippingSettingsSeed = {
  __meta__: {
    name: "Shipping Settings",
    versions: [
      {
        version: "1.0.0",
        description: "Initial shipping settings: free shipping threshold and shipping cost",
        created_at: "2025-12-08 06:23",
      },
    ],
  },
  settings: [
    {
      uuid: crypto.randomUUID(),
      attribute: "shipping_free_threshold",
      value: "100.00",
      type: "number",
      order: 1,
      data_in: {
        description: "Minimum order amount for free shipping (in EUR)",
      },
    },
    {
      uuid: crypto.randomUUID(),
      attribute: "shipping_cost",
      value: "20.00",
      type: "number",
      order: 2,
      data_in: {
        description: "Shipping cost if order amount is below free shipping threshold (in EUR)",
      },
    },
  ],
}

export const shippingSettingsSeed: SeedDefinition = {
  id: 'shipping-settings',
  meta: _shippingSettingsSeed.__meta__,
  getData: () => _shippingSettingsSeed,
}

