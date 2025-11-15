export const systemSeed = {
    __meta__: {
        name: "System Data",
        versions: [
            
            {
                version: "1.0.0",
                description: "Заявка Инвестора added",
                created_at: "2025-11-12 15:54",
            },
            {
                version: "1.0.1",
                description: "Заявка на кредит added",
                created_at: "2025-11-13 15:54",
            },
            {
                version: "1.0.2",
                description: "Deal statuses added",
                created_at: "2025-11-13 16:10",
            },
        ],
    },
    roles: [],

    taxonomy: [

        {
            entity: "deal.dataIn.type",
            name: "INVESTORS_FORM",
            title: "Заявка Инвестора",
            sort_order: 100,
        },
        {
            entity: "deal.dataIn.type",
            name: "LOAN_APPLICATION",
            title: "Заявка на кредит",
            sort_order: 200,
        },

        // Deal statuses
        {
            entity: "deal.statusName",
            name: "NEW",
            title: "Новая Заявка",
            sort_order: 100,
        },
        {
            entity: "deal.statusName",
            name: "SCORING",
            title: "Скоринг",
            sort_order: 200,
        },
        {
            entity: "deal.statusName",
            name: "ACTIVE",
            title: "Активна",
            sort_order: 300,
        },
        {
            entity: "deal.statusName",
            name: "APPROVED",
            title: "Закрыта",
            sort_order: 400,
        },
        {
            entity: "deal.statusName",
            name: "CANCELLED",
            title: "Отклонена",
            sort_order: 500,
        },
        // Journal actions
        {
            entity: "journal.action",
            name: "LOAN_APPLICATION_SNAPSHOT",
            title: "Снимок Заявки на кредит",
            sort_order: 100,
        },
    ]
} as const

