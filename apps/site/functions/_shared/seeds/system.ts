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
            {
                version: "1.0.3",
                description: "Human and Contractor statuses added",
                created_at: "2025-11-17 10:00",
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
        {
            entity: "deal.statusName",
            name: "ADDITIONAL_INFO_REQUESTED",
            title: "Дополнительная информация запрошена",
            sort_order: 600,
        },
        // Human KYC statuses
        {
            entity: "human.statusName",
            name: "PENDING",
            title: "Ожидает KYC",
            sort_order: 100,
        },
        {
            entity: "human.statusName",
            name: "VERIFIED",
            title: "Верифицирован",
            sort_order: 200,
        },
        {
            entity: "human.statusName",
            name: "REJECTED",
            title: "KYC отклонен",
            sort_order: 300,
        },
        {
            entity: "human.type",
            name: "INVESTOR",
            title: "Инвестор",
            sort_order: 100,
        },
        {
            entity: "human.type",
            name: "CLIENT",
            title: "Клиент (Потребитель)",
            sort_order: 200,
        },
        {
            entity: "human.type",
            name: "GUARANTOR",
            title: "Поручитель",
            sort_order: 300,
        },
        // Contractor partnership statuses
        {
            entity: "contractor.statusName",
            name: "PROSPECT",
            title: "Потенциальный партнер",
            sort_order: 100,
        },
        {
            entity: "contractor.statusName",
            name: "ACTIVE",
            title: "Активный партнер",
            sort_order: 200,
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

