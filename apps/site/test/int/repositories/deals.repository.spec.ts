import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";
import { eq, and } from "drizzle-orm";
import { DealsRepository } from "@/shared/repositories/deals.repository";
import { UsersRepository } from "@/shared/repositories/users.repository";
import { UserRolesRepository } from "@/shared/repositories/user-roles.repository";
import { RolesRepository } from "@/shared/repositories/roles.repository";
import { HumanRepository } from "@/shared/repositories/human.repository";
import { FinancesRepository } from "@/shared/repositories/finances.repository";
import {
    LoanApplicationDataIn,
} from "@/shared/types/altrp";
import { generateAid } from "@/shared/generate-aid";
import { NewaltrpFinance } from "@/shared/types/altrp-finance";

describe("DealsRepository", () => {
    let db: D1Database;
    let dealsRepository: DealsRepository;
    let usersRepository: UsersRepository;
    let userRolesRepository: UserRolesRepository;
    let rolesRepository: RolesRepository;
    let humanRepository: HumanRepository;
    let financesRepository: FinancesRepository;

    beforeAll(async () => {
        const platformProxy = await getPlatformProxy({
            configPath: "wrangler.test.toml",
        });

        db = platformProxy.env.DB as D1Database;
        dealsRepository = new DealsRepository();
        usersRepository = UsersRepository.getInstance();
        userRolesRepository = UserRolesRepository.getInstance();
        rolesRepository = RolesRepository.getInstance();
        humanRepository = HumanRepository.getInstance();
        financesRepository = FinancesRepository.getInstance();
    });

    describe("createLoanApplicationDealPublic", () => {
        it("создает заявку, клиента и пользователя с ролью 'client'", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            // Create deal, client and user
            const result = await dealsRepository.createLoanApplicationDealPublic(formData);

            // Check that deal was created
            expect(result.createdDeal).toBeDefined();
            expect(result.createdDeal.daid).toBeDefined();
            // After stop factors check, deal should be in SCORING status (or REJECTED if stop factors found)
            expect(["NEW", "SCORING", "REJECTED"]).toContain(result.createdDeal.statusName);
            expect(result.createdDeal.dataIn).toBeDefined();

            // Check that client was created
            expect(result.client).toBeDefined();
            expect(result.client.email).toBe(email);
            expect(result.client.haid).toBeDefined();
            expect(result.client.type).toBe("CLIENT");

            // Check that journal was created
            expect(result.journal).toBeDefined();

            // Check that user was created
            const user = await usersRepository.findByEmail(email);
            expect(user).toBeDefined();
            expect(user?.email).toBe(email);
            expect(user?.humanAid).toBe(result.client.haid);
            expect(user?.isActive).toBe(true);

            // Check that user has 'client' role
            const clientRole = (await rolesRepository.getFiltered({
                conditions: [{
                    field: "name",
                    operator: "eq",
                    values: ["client"]
                }]
            }, { orders: [{ field: "createdAt", direction: "desc" }] }, { page: 1, limit: 1 })).docs[0];

            expect(clientRole).toBeDefined();

            const userRoles = await userRolesRepository
                .getSelectQuery()
                .where(
                    and(
                        eq(userRolesRepository.schema.userUuid, user!.uuid),
                        eq(userRolesRepository.schema.roleUuid, clientRole.uuid)
                    )
                )
                .execute();

            expect(userRoles.length).toBe(1);
            expect(userRoles[0].userUuid).toBe(user!.uuid);
            expect(userRoles[0].roleUuid).toBe(clientRole.uuid);
        });

        it("назначает роль 'client' существующему пользователю, если он уже есть", async () => {
            const email = faker.internet.email().toLowerCase();
            
            // Create client first to get proper haid
            const client = await humanRepository.generateClientByEmail(email, {
                fullName: faker.person.fullName(),
                dataIn: {
                    phone: faker.phone.number({ style: "international" }),
                },
            });
            
            // Create user manually first (without 'client' role)
            const { hashedPassword, salt } = await (await import("@/shared/password")).preparePassword("testPassword123!");
            const existingUser = await usersRepository.create({
                humanAid: client.haid,
                email: email,
                passwordHash: hashedPassword,
                salt,
                isActive: true,
            });

            expect(existingUser).toBeDefined();

            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            // Create deal, client and ensure user has 'client' role
            const result = await dealsRepository.createLoanApplicationDealPublic(formData);

            // Check that deal was created
            expect(result.createdDeal).toBeDefined();
            expect(result.client).toBeDefined();

            // Check that user still exists (not duplicated)
            const allUsers = await usersRepository.findAll();
            const usersWithEmail = allUsers.filter(u => u.email === email);
            expect(usersWithEmail.length).toBe(1);

            // Check that user has 'client' role
            const clientRole = (await rolesRepository.getFiltered({
                conditions: [{
                    field: "name",
                    operator: "eq",
                    values: ["client"]
                }]
            }, { orders: [{ field: "createdAt", direction: "desc" }] }, { page: 1, limit: 1 })).docs[0];

            expect(clientRole).toBeDefined();

            const userRoles = await userRolesRepository
                .getSelectQuery()
                .where(
                    and(
                        eq(userRolesRepository.schema.userUuid, existingUser.uuid),
                        eq(userRolesRepository.schema.roleUuid, clientRole.uuid)
                    )
                )
                .execute();

            expect(userRoles.length).toBe(1);
            expect(userRoles[0].userUuid).toBe(existingUser.uuid);
            expect(userRoles[0].roleUuid).toBe(clientRole.uuid);
        });

        it("не создает дубликат пользователя при повторном вызове", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            // First call
            const result1 = await dealsRepository.createLoanApplicationDealPublic(formData);
            expect(result1.createdDeal).toBeDefined();
            expect(result1.client).toBeDefined();

            // Get user count before second call
            const allUsersBefore = await usersRepository.findAll();
            const usersWithEmailBefore = allUsersBefore.filter(u => u.email === email);
            expect(usersWithEmailBefore.length).toBe(1);

            // Second call with same email (should not create duplicate user)
            const formData2: LoanApplicationDataIn = {
                ...formData,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
            };
            const result2 = await dealsRepository.createLoanApplicationDealPublic(formData2);
            expect(result2.createdDeal).toBeDefined();

            // Check that no duplicate user was created
            const allUsersAfter = await usersRepository.findAll();
            const usersWithEmailAfter = allUsersAfter.filter(u => u.email === email);
            expect(usersWithEmailAfter.length).toBe(1);
            expect(usersWithEmailAfter[0].uuid).toBe(usersWithEmailBefore[0].uuid);
        });
    });

    describe("approveLoanApplication", () => {
        it("одобряет заявку, обновляет статус, сохраняет комментарий и менеджера, генерирует график платежей", async () => {
            // Create loan application
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            const createResult = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = createResult.createdDeal;

            // Find or create user with admin role
            const adminRole = (await rolesRepository.getFiltered({
                conditions: [{
                    field: "name",
                    operator: "eq",
                    values: ["admin"]
                }]
            }, { orders: [{ field: "createdAt", direction: "desc" }] }, { page: 1, limit: 1 })).docs[0];

            expect(adminRole).toBeDefined();

            // Find user with admin role or create one
            const allUsers = await usersRepository.findAll();
            let adminUser = null;

            // Check each user for admin role
            for (const user of allUsers) {
                const userRoles = await userRolesRepository
                    .getSelectQuery()
                    .where(
                        and(
                            eq(userRolesRepository.schema.userUuid, user.uuid),
                            eq(userRolesRepository.schema.roleUuid, adminRole.uuid)
                        )
                    )
                    .execute();
                if (userRoles.length > 0) {
                    adminUser = user;
                    break;
                }
            }

            // If no admin user found, create one
            if (!adminUser) {
                const adminEmail = faker.internet.email().toLowerCase();
                const adminHuman = await humanRepository.generateClientByEmail(adminEmail, {
                    fullName: faker.person.fullName(),
                    dataIn: {
                        phone: faker.phone.number({ style: "international" }),
                    },
                });

                const { hashedPassword, salt } = await (await import("@/shared/password")).preparePassword("testPassword123!");
                adminUser = await usersRepository.create({
                    humanAid: adminHuman.haid,
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    salt,
                    isActive: true,
                });

                await userRolesRepository.assignRolesToUser(adminUser.uuid, [adminRole.uuid]);
            }

            // Approve loan application
            const securityComment = "Заявка одобрена после проверки";
            const result = await dealsRepository.approveLoanApplication(
                deal.uuid,
                securityComment,
                adminUser.uuid
            );

            // Check that deal status is updated
            expect(result.updatedDeal.statusName).toBe("APPROVED");
            expect(result.updatedDeal.dataIn.decision).toBeDefined();
            expect(result.updatedDeal.dataIn.decision?.securityServiceComment).toBe(securityComment);
            expect(result.updatedDeal.dataIn.managerUuid).toBe(adminUser.uuid);

            // Check that journal was created
            expect(result.journal).toBeDefined();
            expect([
                "LOAN_APPLICATION_SNAPSHOT",
                "DEAL_APPROVED",
            ]).toContain(result.journal.action);

            // Check that payment schedule was generated
            const finances = await financesRepository.getFiltered({
                conditions: [{
                    field: "fullDaid",
                    operator: "eq",
                    values: [deal.daid],
                }]
            }, { orders: [{ field: "order", direction: "asc" }] }, { page: 1, limit: 100 });

            expect(finances.docs.length).toBe(12); // 12 months term
            finances.docs.forEach((finance, index) => {
                expect(finance.statusName).toBe("PENDING");
                expect(finance.fullDaid).toBe(deal.daid);
                if (finance.dataIn && typeof finance.dataIn === 'object' && 'paymentNumber' in finance.dataIn) {
                    expect((finance.dataIn as any).paymentNumber).toBe(index + 1);
                }
            });
        });

        it("выбрасывает ошибку при невалидном managerUuid", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            const createResult = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = createResult.createdDeal;

            // Try to approve with invalid manager UUID
            await expect(
                dealsRepository.approveLoanApplication(
                    deal.uuid,
                    "Test comment",
                    "invalid-uuid"
                )
            ).rejects.toThrow();
        });
    });

    describe("rejectLoanApplication", () => {
        it("отклоняет заявку, обновляет статус, сохраняет комментарий и менеджера, не генерирует график платежей", async () => {
            // Create loan application
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            const createResult = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = createResult.createdDeal;

            // Find or create user with admin role
            const adminRole = (await rolesRepository.getFiltered({
                conditions: [{
                    field: "name",
                    operator: "eq",
                    values: ["admin"]
                }]
            }, { orders: [{ field: "createdAt", direction: "desc" }] }, { page: 1, limit: 1 })).docs[0];

            expect(adminRole).toBeDefined();

            // Find user with admin role or create one
            const allUsers = await usersRepository.findAll();
            let adminUser = null;

            // Check each user for admin role
            for (const user of allUsers) {
                const userRoles = await userRolesRepository
                    .getSelectQuery()
                    .where(
                        and(
                            eq(userRolesRepository.schema.userUuid, user.uuid),
                            eq(userRolesRepository.schema.roleUuid, adminRole.uuid)
                        )
                    )
                    .execute();
                if (userRoles.length > 0) {
                    adminUser = user;
                    break;
                }
            }

            // If no admin user found, create one
            if (!adminUser) {
                const adminEmail = faker.internet.email().toLowerCase();
                const adminHuman = await humanRepository.generateClientByEmail(adminEmail, {
                    fullName: faker.person.fullName(),
                    dataIn: {
                        phone: faker.phone.number({ style: "international" }),
                    },
                });

                const { hashedPassword, salt } = await (await import("@/shared/password")).preparePassword("testPassword123!");
                adminUser = await usersRepository.create({
                    humanAid: adminHuman.haid,
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    salt,
                    isActive: true,
                });

                await userRolesRepository.assignRolesToUser(adminUser.uuid, [adminRole.uuid]);
            }

            // Reject loan application
            const securityComment = "Заявка отклонена по причине недостаточного дохода";
            const result = await dealsRepository.rejectLoanApplication(
                deal.uuid,
                securityComment,
                adminUser.uuid
            );

            // Check that deal status is updated
            expect(result.updatedDeal.statusName).toBe("CANCELLED");
            expect(result.updatedDeal.dataIn.decision).toBeDefined();
            expect(result.updatedDeal.dataIn.decision?.securityServiceComment).toBe(securityComment);
            expect(result.updatedDeal.dataIn.managerUuid).toBe(adminUser.uuid);

            // Check that journal was created
            expect(result.journal).toBeDefined();
            expect([
                "LOAN_APPLICATION_SNAPSHOT",
                "DEAL_CANCELLED",
            ]).toContain(result.journal.action);

            // Check that payment schedule was NOT generated
            const finances = await financesRepository.getFiltered({
                conditions: [{
                    field: "fullDaid",
                    operator: "eq",
                    values: [deal.daid],
                }]
            }, { orders: [{ field: "order", direction: "asc" }] }, { page: 1, limit: 100 });

            expect(finances.docs.length).toBe(0); // No finance records should be created
        });

        it("выбрасывает ошибку при невалидном managerUuid", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            const createResult = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = createResult.createdDeal;

            // Try to reject with invalid manager UUID
            await expect(
                dealsRepository.rejectLoanApplication(
                    deal.uuid,
                    "Test comment",
                    "invalid-uuid"
                )
            ).rejects.toThrow();
        });
    });

    describe("checkStopFactors - автоматическое отклонение заявки", () => {
        it("отклоняет заявку со статусом REJECTED, если у клиента есть просроченная задолженность", async () => {
            // Step 1: Create a user and client with first application
            const email = faker.internet.email().toLowerCase();
            const formData1: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000",
                term: [12],
            };

            const firstResult = await dealsRepository.createLoanApplicationDealPublic(formData1);
            const firstDeal = firstResult.createdDeal;
            const client = firstResult.client;

            // Step 2: Create an overdue Finance record for this client
            const overdueFinance: NewaltrpFinance = {
                uuid: crypto.randomUUID(),
                faid: generateAid('f'),
                fullDaid: firstDeal.daid,
                statusName: 'OVERDUE',
                dataIn: {
                    paymentNumber: 1,
                    paymentDate: new Date().toISOString().split('T')[0],
                    totalAmount: 10000,
                    principalAmount: 7000,
                    profitShareAmount: 2500,
                    serviceFeeAmount: 500,
                    autoDebitEnabled: false,
                    preferredPaymentChannel: 'CARD',
                    reminderScheduleDays: [7, 3, 1],
                    dealAid: firstDeal.daid,
                    clientAid: client.haid,
                    generatedBy: 'SYSTEM',
                },
            };

            const createdFinance = await financesRepository.create(overdueFinance);
            expect(createdFinance).toBeDefined();
            expect(createdFinance.statusName).toBe('OVERDUE');
            // clientAid хранится в dataIn (JSONB)
            if (createdFinance.dataIn && typeof createdFinance.dataIn === 'object') {
                expect((createdFinance.dataIn as any).clientAid).toBe(client.haid);
            } else if (typeof createdFinance.dataIn === 'string') {
                const dataIn = JSON.parse(createdFinance.dataIn);
                expect(dataIn.clientAid).toBe(client.haid);
            }

            // Step 3: Try to create a new application for the same client
            const formData2: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email, // Same email = same client
                productPrice: "50000",
                term: [6],
            };

            const secondResult = await dealsRepository.createLoanApplicationDealPublic(formData2);
            const secondDeal = secondResult.createdDeal;

            // Step 4: Verify that the application was automatically rejected
            expect(secondDeal.statusName).toBe("REJECTED");
            expect(secondDeal.dataOut).toBeDefined();
            
            // Check rejection reason in dataOut
            if (secondDeal.dataOut && typeof secondDeal.dataOut === 'object') {
                const dataOut = secondDeal.dataOut as any;
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toBe("Имеется активная просроченная задолженность");
            } else if (typeof secondDeal.dataOut === 'string') {
                const dataOut = JSON.parse(secondDeal.dataOut);
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toBe("Имеется активная просроченная задолженность");
            }

            // Verify that journal was created
            expect(secondResult.journal).toBeDefined();
            expect([
                "LOAN_APPLICATION_SNAPSHOT",
                "DEAL_REJECTED",
            ]).toContain(secondResult.journal.action);
        });

        it("отклоняет заявку со статусом REJECTED, если сумма меньше 3,000 ₽", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "2000", // Less than 3,000
                term: [12],
            };

            const result = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = result.createdDeal;

            // Verify that the application was automatically rejected
            expect(deal.statusName).toBe("REJECTED");
            expect(deal.dataOut).toBeDefined();
            
            // Check rejection reason in dataOut
            if (deal.dataOut && typeof deal.dataOut === 'object') {
                const dataOut = deal.dataOut as any;
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toContain("Сумма не соответствует лимитам");
            } else if (typeof deal.dataOut === 'string') {
                const dataOut = JSON.parse(deal.dataOut);
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toContain("Сумма не соответствует лимитам");
            }
        });

        it("отклоняет заявку со статусом REJECTED, если сумма больше 300,000 ₽", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "350000", // More than 300,000
                term: [12],
            };

            const result = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = result.createdDeal;

            // Verify that the application was automatically rejected
            expect(deal.statusName).toBe("REJECTED");
            expect(deal.dataOut).toBeDefined();
            
            // Check rejection reason in dataOut
            if (deal.dataOut && typeof deal.dataOut === 'object') {
                const dataOut = deal.dataOut as any;
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toContain("Сумма не соответствует лимитам");
            } else if (typeof deal.dataOut === 'string') {
                const dataOut = JSON.parse(deal.dataOut);
                expect(dataOut.rejection_reason).toBeDefined();
                expect(dataOut.rejection_reason).toContain("Сумма не соответствует лимитам");
            }
        });

        it("автоматически переводит заявку в статус SCORING, если стоп-факторы не найдены", async () => {
            const email = faker.internet.email().toLowerCase();
            const formData: LoanApplicationDataIn = {
                type: "LOAN_APPLICATION",
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number({ style: "international" }),
                email: email,
                productPrice: "100000", // Valid amount (between 3,000 and 300,000)
                term: [12],
            };

            const result = await dealsRepository.createLoanApplicationDealPublic(formData);
            const deal = result.createdDeal;

            // Verify that the application was automatically moved to SCORING status (no stop factors)
            expect(deal.statusName).toBe("SCORING");
            
            // Verify that scoring result is saved in dataOut
            expect(deal.dataOut).toBeDefined();
            if (deal.dataOut && typeof deal.dataOut === 'object') {
                const dataOut = deal.dataOut as any;
                expect(dataOut.scoring_result).toBeDefined();
                expect(dataOut.scoring_result.score).toBe(500); // Initial score
                expect(dataOut.scoring_result.red_flags_checked).toBe(true);
            } else if (typeof deal.dataOut === 'string') {
                const dataOut = JSON.parse(deal.dataOut);
                expect(dataOut.scoring_result).toBeDefined();
                expect(dataOut.scoring_result.score).toBe(500);
                expect(dataOut.scoring_result.red_flags_checked).toBe(true);
            }
        });
    });
});

