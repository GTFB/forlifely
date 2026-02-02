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
            {
                version: "1.0.4",
                description: "User roles added",
                created_at: "2025-11-18 12:00",
            },
            {
                version: "1.0.5",
                description: "Finance statuses added",
                created_at: "2025-01-27 12:00",
            },
            {
                version: "1.0.6",
                description: "Wallet types added",
                created_at: "2025-12-26 12:00",
            },
        ],
    },
    roles: [
        {
            uuid: "948c9eb8-0ab6-4dba-9bdb-8decf45abed4",
            name: "client",
            title: "Потребитель",
            dataIn: {
                auth_redirect_url: '/c',
            },
            description: "External consumer who applies for installment and manages their repayments.",
            is_system: 1,
            order: 100,
        },
        {
            uuid: "e03c5ef0-bbb1-4c2c-8c04-937298048913",
            name: "investor",
            title: "Инвестор",
            dataIn: {
                auth_redirect_url: '/i',
            },
            description: "External investor who provides capital for financing deals.",
            is_system: 1,
            order: 200,
        },
        {
            uuid: "3ce5a435-0792-4aa1-8ac2-b1de6fa42d60",
            name: "partner",
            title: "Партнер",
            dataIn: {
                auth_redirect_url: '/p',
            },
            description: "Retail partner representative who creates applications and tracks deals.",
            is_system: 1,
            order: 300,
        },
        {
            uuid: "4a053faa-6c17-4e3a-85fc-23840cb11f0e",
            name: "admin",
            title: "Куратор",
            dataIn: {
                auth_redirect_url: '/admin',
            },
            description: "User with full access to all system functions and settings.",
            is_system: 1,
            order: 1000,
        },
        {
            uuid: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
            name: "tester",
            title: "Тестер",
            dataIn: {
                auth_redirect_url: '/t',
            },
            description: "Game tester who completes testing tasks and earns reward points.",
            is_system: 1,
            order: 400,
        },
    ],

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
            title: "Одобрена",
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
            name: "REJECTED",
            title: "Отклонена (автоматически)",
            sort_order: 510,
        },
        {
            entity: "deal.statusName",
            name: "ADDITIONAL_INFO_REQUESTED",
            title: "Дополнительная информация запрошена",
            sort_order: 600,
        },
        {
            entity: "deal.statusName",
            name: "COMPLETED",
            title: "Завершена",
            sort_order: 700,
        },
        {
            entity: "deal.statusName",
            name: "OVERDUE",
            title: "Просрочена",
            sort_order: 800,
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
        // Finance statuses
        {
            entity: "finance.statusName",
            name: "PENDING",
            title: "Ожидается",
            sort_order: 100,
        },
        {
            entity: "finance.statusName",
            name: "PAID",
            title: "Оплачен",
            sort_order: 200,
        },
        {
            entity: "finance.statusName",
            name: "OVERDUE",
            title: "Просрочен",
            sort_order: 300,
        },
        // Journal actions
        {
            entity: "journal.action",
            name: "LOAN_APPLICATION_SNAPSHOT",
            title: "Снимок Заявки на кредит",
            sort_order: 100,
        },
        // MessageThread statuses
        {
            entity: "messageThread.statusName",
            name: "OPEN",
            title: "Открыт",
            sort_order: 100,
        },
        {
            entity: "messageThread.statusName",
            name: "CLOSED",
            title: "Закрыт",
            sort_order: 200,
        },
        // Wallet types
        {
            entity: "wallet.dataIn.type",
            name: "INVESTOR",
            title: "Инвестор",
            sort_order: 100,
        },
        {
            entity: "wallet.dataIn.type",
            name: "CLIENT",
            title: "Клиент (Потребитель)",
            sort_order: 200,
        },
    ],

    settings: [
        // Scoring weights - веса для расчета скорингового балла
        
    ],
} as const

