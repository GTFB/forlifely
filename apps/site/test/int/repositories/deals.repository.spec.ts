import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";

import { DealsRepository } from "../../../functions/_shared/repositories/deals.repository";
import { LoanApplicationDataIn } from "../../../functions/_shared/types/esnad";

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

    describe("createLoanApplicationDeal", () => {
        it("создает заявку на кредит с нормализацией данных формы", async () => {
            const rawFirstName = ` ${faker.person.firstName()} `;
            const rawLastName = ` ${faker.person.lastName()} `;
            const rawPhone = ` ${faker.phone.number({ style: "international" })} `;
            const rawEmail = ` ${faker.internet.email().toLowerCase()} `;
            const rawProductPrice = ` ${faker.commerce.price()} `;
            const rawTerm: number[] = [12, 24];

            const deal = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: rawFirstName,
                lastName: rawLastName,
                phone: rawPhone,
                email: rawEmail.toUpperCase(),
                productPrice: rawProductPrice,
                term: rawTerm,
            } satisfies LoanApplicationDataIn);

            expect(deal).toBeDefined();
            expect(deal.uuid).toBeDefined();
            expect(deal.daid).toMatch(/^d-/);
            expect(deal.fullDaid).toMatch(/^d-/);
            expect(deal.statusName).toBe("NEW");

            const expectedName = `${rawFirstName.trim()} ${rawLastName.trim()}`.trim();
            const expectedTitle = expectedName ? `Loan application - ${expectedName}` : "Loan application";
            expect(deal.title).toBe(expectedTitle);

            const dataIn = typeof deal.dataIn === "string" ? JSON.parse(deal.dataIn) : deal.dataIn;

            expect(dataIn).toEqual({
                type: "LOAN_APPLICATION",
                firstName: rawFirstName.trim(),
                lastName: rawLastName.trim(),
                phone: rawPhone.trim(),
                email: rawEmail.trim().toLowerCase(),
                productPrice: rawProductPrice.trim(),
                term: rawTerm,
            });
        });

        it("бросает ошибку, если отсутствуют обязательные поля", async () => {
            const incompleteData = {
                type: "LOAN_APPLICATION",
                firstName: "John",
                lastName: " ", // пустое после trim
                phone: "",
                email: "user@example.com",
                productPrice: "1000",
                term: [],
            } satisfies LoanApplicationDataIn;

            await expect(dealsRepository.createLoanApplicationDealPublic(incompleteData)).rejects.toThrow(
                "LoanApplicationDataIn is missing required fields: lastName, phone, term",
            );
        });
    });

    describe("getDeals", () => {
        it("возвращает новую сделку первой и исключает soft-delete", async () => {
            const createdDeal = await dealsRepository.create({
                daid: `d-${crypto.randomUUID()}`,
                title: `Integration deal ${Date.now()}`,
                statusName: "NEW",
                dataIn: { type: "TEST" },
            });

            const result = await dealsRepository.getDeals({
                pagination: { page: 1, limit: 5 },
            });
            expect(result.docs.length).toBeGreaterThan(0);
            expect(result.docs[0].uuid).toBeDefined();
            expect(result.docs[0].uuid).not.toBe("");
            expect(result.docs[0].uuid).toBe(createdDeal.uuid);

            await dealsRepository.deleteByUuid(createdDeal.uuid);

            const afterDelete = await dealsRepository.getDeals({
                pagination: { page: 1, limit: 5 },
            });
            expect(afterDelete.docs.find((deal) => deal.uuid === createdDeal.uuid)).toBeUndefined();
        });
    });
});

