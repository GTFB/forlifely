import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";
import { eq, like } from "drizzle-orm";
import { DealsRepository } from "../../../functions/_shared/repositories/deals.repository";
import { JournalsRepository } from "../../../functions/_shared/repositories/journals.repository";
import {
    LoanApplicationDataIn,
    LoanApplicationDecision,
    LoanApplicationSnapshotDetails,
    LoanApplicationStatus,
} from "../../../functions/_shared/types/esnad";

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
            const rawProductPrice = ` ${faker.commerce.price({ min: 10000, max: 1000000, dec: 0 })} `;
            const rawTerm: number[] = [12, 24];

            const { createdDeal, journal, client } = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: rawFirstName,
                lastName: rawLastName,
                phone: rawPhone,
                email: rawEmail.toUpperCase(),
                productPrice: rawProductPrice,
                term: rawTerm,
            } satisfies LoanApplicationDataIn);

            expect(createdDeal).toBeDefined();
            expect(createdDeal.uuid).toBeDefined();
            expect(createdDeal.daid).toMatch(/^d-/);
            expect(createdDeal.fullDaid).toMatch(/^d-/);
            expect(createdDeal.statusName).toBe("NEW");

            const expectedName = `${rawFirstName.trim()} ${rawLastName.trim()}`.trim();
            const expectedTitle = expectedName ? `Loan application - ${expectedName}` : "Loan application";
            expect(createdDeal.title).toBe(expectedTitle);

            const dataIn = typeof createdDeal.dataIn === "string" ? JSON.parse(createdDeal.dataIn) : createdDeal.dataIn;

            expect(dataIn).toEqual({
                type: "LOAN_APPLICATION",
                firstName: rawFirstName.trim(),
                lastName: rawLastName.trim(),
                phone: rawPhone.trim(),
                email: rawEmail.trim().toLowerCase(),
                productPrice: rawProductPrice.trim(),
                term: rawTerm,
            });

            expect(createdDeal.clientAid).toBeDefined();

            expect(journal).toBeDefined();
            expect(journal.action).toBe("LOAN_APPLICATION_SNAPSHOT");
            expect(journal.details.previousSnapshot).toBeNull();
            expect(journal.details.snapshot).toEqual(createdDeal);

            expect(client).toBeDefined();
            expect(client.uuid).toBeDefined();
            expect(client.haid).toMatch(/^h-/);
            expect(client.haid).toEqual(createdDeal.clientAid as string);
            expect(client.type).toBe("CLIENT");
            expect(client.statusName).toBe("PENDING");
            expect(client.email).toBe(rawEmail.trim().toLowerCase());
            expect(client.fullName).toBe(expectedName);

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
                "Отсутствуют обязательные поля LoanApplicationDataIn: lastName, phone, term. Пожалуйста, свяжитесь с администратором системы.",
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

    describe("updateLoanApplicationDeal", () => {
        it("создает цепочку снимков в журнале при изменении статуса", async () => {
            const { createdDeal } = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: faker.internet.email(),
                productPrice: faker.commerce.price({ min: 10000, max: 1000000, dec: 0 }),
                term: [12, 24],
            } satisfies LoanApplicationDataIn);

            const firstStatus: LoanApplicationStatus = "SCORING";
            const secondStatus: LoanApplicationStatus = "ACTIVE";

            const firstUpdate = await dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                statusName: firstStatus,
            });
            const firstUpdatedDeal = firstUpdate.updatedDeal;
            expect(firstUpdatedDeal.statusName).toEqual(firstStatus);

            const secondUpdate = await dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                statusName: secondStatus,
            });
            const secondUpdatedDeal = secondUpdate.updatedDeal;
            expect(secondUpdatedDeal.statusName).toEqual(secondStatus);

            const journalsRepository = JournalsRepository.getInstance(db);
            const relatedJournals = await journalsRepository.getSelectQuery()
                .where(    like(journalsRepository.schema.details, `%${createdDeal.uuid}%`)).orderBy(journalsRepository.schema.createdAt);

                
            expect(relatedJournals).toHaveLength(3);

            const snapshots = relatedJournals.map(
                (journal) =>
                    (typeof journal.details === "string"
                        ? JSON.parse(journal.details)
                        : journal.details) as LoanApplicationSnapshotDetails,
            );

            expect(snapshots[0].previousSnapshot).toBeNull();
            expect(snapshots[0].snapshot).toEqual(createdDeal);

            expect(snapshots[1].previousSnapshot).toEqual(createdDeal);
            expect(snapshots[1].snapshot).toEqual(firstUpdatedDeal);

            expect(snapshots[2].previousSnapshot).toEqual(firstUpdatedDeal);
            expect(snapshots[2].snapshot).toEqual(secondUpdatedDeal);

            const allDeals = await dealsRepository.findAll();
            const relatedDeals = allDeals.filter((deal) => deal.uuid === createdDeal.uuid);
            expect(relatedDeals).toHaveLength(1);
        });

        it("бросает ошибку, если decision без responsibleEmployeeUuid", async () => {
            const { createdDeal } = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: faker.internet.email(),
                productPrice: faker.commerce.price({ min: 10000, max: 1000000, dec: 0 }),
                term: [12, 24],
            } satisfies LoanApplicationDataIn);

            const currentDataIn =
                typeof createdDeal.dataIn === "string"
                    ? (JSON.parse(createdDeal.dataIn) as LoanApplicationDataIn)
                    : createdDeal.dataIn;

            await expect(
                dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                    dataIn: {
                        ...currentDataIn,
                        decision: {
                            securityServiceComment: "Needs more info",
                        } as LoanApplicationDecision,
                    },
                }),
            ).rejects.toThrow("Произошла внутренняя ошибка при обработке решения. Пожалуйста, свяжитесь с администратором системы.");
        });

        it("бросает ошибку, если responsibleEmployeeUuid пустой или не строка", async () => {
            const { createdDeal } = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: faker.internet.email(),
                productPrice: faker.commerce.price({ min: 10000, max: 1000000, dec: 0 }),
                term: [12, 24],
            } satisfies LoanApplicationDataIn);

            const currentDataIn =
                typeof createdDeal.dataIn === "string"
                    ? (JSON.parse(createdDeal.dataIn) as LoanApplicationDataIn)
                    : createdDeal.dataIn;

            await expect(
                dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                    dataIn: {
                        ...currentDataIn,
                        decision: {
                            securityServiceComment: "Empty uuid",
                            responsibleEmployeeUuid: "   ",
                        } as LoanApplicationDecision,
                    },
                }),
            ).rejects.toThrow("Произошла внутренняя ошибка при обработке решения. Пожалуйста, свяжитесь с администратором системы.");

            await expect(
                dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                    dataIn: {
                        ...currentDataIn,
                        decision: {
                            securityServiceComment: "Non string uuid",
                            responsibleEmployeeUuid: 123 as unknown as string,
                        } as unknown as LoanApplicationDecision,
                    },
                }),
            ).rejects.toThrow("Произошла внутренняя ошибка при обработке решения. Пожалуйста, свяжитесь с администратором системы.");
        });

        it("бросает ошибку, если responsibleEmployeeUuid невалидный или сотрудник не найден", async () => {
            const { createdDeal } = await dealsRepository.createLoanApplicationDealPublic({
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: faker.internet.email(),
                productPrice: faker.commerce.price({ min: 10000, max: 1000000, dec: 0 }),
                term: [12, 24],
            } satisfies LoanApplicationDataIn);

            const currentDataIn =
                typeof createdDeal.dataIn === "string"
                    ? (JSON.parse(createdDeal.dataIn) as LoanApplicationDataIn)
                    : createdDeal.dataIn;

            await expect(
                dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                    dataIn: {
                        ...currentDataIn,
                        decision: {
                            securityServiceComment: "Invalid uuid format",
                            responsibleEmployeeUuid: "invalid-uuid",
                        } as LoanApplicationDecision,
                    },
                }),
            ).rejects.toThrow("Произошла внутренняя ошибка при обработке решения. Пожалуйста, свяжитесь с администратором системы.");

            await expect(
                dealsRepository.updateLoanApplicationDeal(createdDeal.uuid, {
                    dataIn: {
                        ...currentDataIn,
                        decision: {
                            securityServiceComment: "Employee not found",
                            responsibleEmployeeUuid: crypto.randomUUID(),
                        } as LoanApplicationDecision,
                    },
                }),
            ).rejects.toThrow("Произошла внутренняя ошибка при обработке решения. Пожалуйста, свяжитесь с администратором системы.");
        });
    });
});

