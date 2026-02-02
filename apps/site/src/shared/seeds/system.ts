export const systemSeed = {
    __meta__: {
        name: "System Data",
        versions: [
            {
                version: "1.0.0",
                date: "2026-02-02",
                description: "Initial version",
            },
        ],
    },
    roles: [
        {
            uuid: "afbfa516-39fb-41aa-9cd0-a61c7f0b093f",
            name: "developer",
            title: "Разработчик",
            dataIn: {
                auth_redirect_url: '/d',
            },
            description: "Роль для разработчиков системы",
            is_system: 1,
            order: 100,
        },
    ],

    taxonomy: [

    ],

    settings: [
        // Scoring weights - веса для расчета скорингового балла
        
    ],
} as const

