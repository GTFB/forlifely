import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";

import { DealsRepository } from "../../../functions/_shared/repositories/deals.repository";

describe("DealsRepository", () => {
    let db: D1Database;
    let dealsRepository: DealsRepository;

    beforeAll(async () => {
        const platformProxy = await getPlatformProxy({
            configPath: "wrangler.test.toml",
        });

        db = platformProxy.env.DB as D1Database;
        dealsRepository = new DealsRepository(db);
    });

    describe("createInvestorsFormDeal", () => {
        it("создает сделку с очищенными данными формы", async () => {
            const rawName = ` ${faker.person.firstName()} `;
            const rawPhone = ` ${faker.phone.number({ style: "international" })} `;
            const rawEmail = ` ${faker.internet.email().toLowerCase()} `;

            const deal = await dealsRepository.createInvestorsFormDeal({
                name: rawName,
                phone: rawPhone,
                email: rawEmail,
            });

            expect(deal).toBeDefined();
            expect(deal.uuid).toBeDefined();
            expect(deal.daid).toMatch(/^d-/);
            expect(deal.fullDaid).toMatch(/^d-/);
            expect(deal.statusName).toBe("NEW");
            expect(deal.title).toBe(`Investors form - ${rawName.trim()}`);

            const dataIn = typeof deal.dataIn === "string" ? JSON.parse(deal.dataIn) : deal.dataIn;

            expect(dataIn).toEqual({
                type: "INVESTORS_FORM",
                formData: {
                    name: rawName.trim(),
                    phone: rawPhone.trim(),
                    email: rawEmail.trim(),
                },
            });
        });
    });
});

