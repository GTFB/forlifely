import type { SeedDefinition, SeedData } from './index'

const _systemSeed = {
  __meta__: {
    name: "System Data",
    versions: [
      {
        version: "1.0.0",
        description: "Initial system data with Storekeeper and Manager roles",
        created_at: "2025-11-01 15:54",
      },
      {
        version: "1.0.1",
        description: "Updated role descriptions and added auth redirect URLs",
        created_at: "2025-11-01 16:20",
      },
      {
        version: "1.0.2",
        description: "Translated taxonomy title for products: Published → Опубликовано",
        created_at: "2025-11-03 10:15",
      },
      {
        version: "1.1.0",
        description: "Added product taxonomy statuses: DRAFT, ARCHIEVED, CANCELLED, ON_APPROVAL, IN_PROGRESS, ACTIVE, COMPLETED, ON_PAUSE",
        created_at: "2025-11-03 10:20",
      },
      {
        version: "1.1.1",
        description: "Added product taxonomy categories: KOROBKA_PROD, GOTOVOE_PROD, KOLPAK_PROD, KAMU_PROD, PROMO_PROD, STEKLO_PROD, TERMO_PROD, FANTIK_PROD",
        created_at: "2025-11-04 10:20",
      },
      {
        version: "1.1.2",
        description: "Added contractor taxonomy statuses: ACTIVE",
        created_at: "2025-11-04 10:25",
      },
      {
        version: "1.1.3",
        description: "Added inventory statuses: INCOME_INV, EXPENSE_INV, MANUFACTURING_INV, UNAVAILABLE, COMMITTED_INV, DISPOSAL_INV, IN_TRANSPORTING_INV, RETURN_INV",
        created_at: "2025-11-04 10:30",
      },
      {
        version: "1.1.4",
        description: "Added base moves statuses: DRAFT, CANCELLED, ON_APPROVAL, IN_PROGRESS, ACTIVE, COMPLETED, ON_PAUSE",
        created_at: "2025-11-04 10:35",
      },
      {
        version: "1.1.5",
        description: "Added wallet transaction statuses: COMPLETED_PAYMENT, CANCELLED_PAYMENT, PENDING_PAYMENT",
        created_at: "2025-11-07 10:35",
      },
    ],
  },
  roles: [
    {
      uuid: "18772c7f-4233-4e63-b837-2411b10a0a0c",
      title: "Storekeeper",
      name: "storekeeper",
      description: "Storekeeper",
      is_system: true,
      data_in: {
        auth_redirect_url: "/s",
      },
      raid: "r-store1",
      order: 2,
    },
    {
      uuid: "2136abbc-9fdc-4aac-9aa8-7d05af7c906e",
      title: "Manager",
      name: "manager",
      description: "Manager",
      is_system: true,
      data_in: {
        auth_redirect_url: "/m",
      },
      raid: "r-manag1",
      order: 3,
    },
    {
      uuid: "3247bccd-afed-5bbd-a9b9-8e16bg8d907f",
      title: "Editor",
      name: "editor",
      description: "Content Editor",
      is_system: true,
      data_in: {
        auth_redirect_url: "/editor",
      },
      raid: "r-edito1",
      order: 4,
    },
  ],
  taxonomy: [
    {
      entity: "products",
      name: "PUBLISHED",
      title: "Опубликовано",
      sort_order: 100,
    },
    {
      entity: "products",
      name: "DRAFT",
      title: "Черновик",
      sort_order: 200,
    },
    {
      entity: "products",
      name: "ARCHIEVED",
      title: "Архивировано",
      sort_order: 300,
    },
    {
      entity: "products",
      name: "CANCELLED",
      title: "Отменено",
      sort_order: 400,
    },
    {
      entity: "products",
      name: "ON_APPROVAL",
      title: "На согласовании",
      sort_order: 500,
    },
    {
      entity: "products",
      name: "IN_PROGRESS",
      title: "В работе",
      sort_order: 600,
    },
    {
      entity: "products",
      name: "ACTIVE",
      title: "Активно",
      sort_order: 700,
    },
    {
      entity: "products",
      name: "COMPLETED",
      title: "Завершено",
      sort_order: 800,
    },
    {
      entity: "products",
      name: "ON_PAUSE",
      title: "На паузе",
      sort_order: 900,
    },
    //contractors statuses
    {
      entity: "contractors.status_name",
      name: "ACTIVE",
      title: "Активно",
      sort_order: 100,
    },
    //relations.MOVE_ITEM statuses
    {
      entity: "relations.MOVE_ITEM",
      name: "INCOME_INV",
      title: "Приход",
      sort_order: 100,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "EXPENSE_INV",
      title: "Расход",
      sort_order: 200,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "MANUFACTURING_INV",
      title: "Производство",
      sort_order: 300,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "UNAVAILABLE",
      title: "Недоступно",
      sort_order: 400,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "COMMITTED_INV",
      title: "Зарезервировано",
      sort_order: 500,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "DISPOSAL_INV",
      title: "Списание",
      sort_order: 600,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "IN_TRANSPORTING_INV",
      title: "В транспортировке",
      sort_order: 700,
    },
    {
      entity: "relations.MOVE_ITEM",
      name: "RETURN_INV",
      title: "Возврат",
      sort_order: 800,
    },
    //base moves statuses
    {
      entity: "base_moves",
      name: "DRAFT",
      title: "Черновик",
      sort_order: 200,
    },
    {
      entity: "base_moves",
      name: "CANCELLED",
      title: "Отменено",
      sort_order: 400,
    },
    {
      entity: "base_moves",
      name: "ON_APPROVAL",
      title: "На согласовании",
      sort_order: 500,
    },
    {
      entity: "base_moves",
      name: "IN_PROGRESS",
      title: "В работе",
      sort_order: 600,
    },
    {
      entity: "base_moves",
      name: "ACTIVE",
      title: "Активно",
      sort_order: 700,
    },
    {
      entity: "base_moves",
      name: "COMPLETED",
      title: "Завершено",
      sort_order: 800,
    },
    {
      entity: "base_moves",
      name: "ON_PAUSE",
      title: "На паузе",
      sort_order: 900,
    },
    /**
     * wallet transaction statuses
     */
    {
      entity: "wallet_transactions",
      name: "COMPLETED_PAYMENT",
      title: "Завершено",
      sort_order: 100,
    },
    {
      entity: "wallet_transactions",
      name: "CANCELLED_PAYMENT",
      title: "Отменено",
      sort_order: 200,
    },
    {
      entity: "wallet_transactions",
      name: "PENDING_PAYMENT",
      title: "Ожидает оплаты",
      sort_order: 300,
    },
    // texts taxonomy types
    {
      entity: "texts",
      name: "news",
      title: "Новости",
      sort_order: 100,
    },
    {
      entity: "texts",
      name: "legal",
      title: "Юридические документы",
      sort_order: 200,
    },
    // product_attributes taxonomy
    {
      entity: "product_attributes",
      name: "Country",
      title: "Страна",
      sort_order: 100,
    },
    {
      entity: "product_attributes",
      name: "length",
      title: "Длина",
      sort_order: 200,
    },
    {
      entity: "product_attributes",
      name: "weight",
      title: "Вес",
      sort_order: 300,
    },
    {
      entity: "product_attributes",
      name: "VBN",
      title: "ВБН",
      sort_order: 400,
    },
  ],
} 

export const systemSeed: SeedDefinition = {
  id: 'system',
  meta: _systemSeed.__meta__,
  getData: () => _systemSeed,
}
