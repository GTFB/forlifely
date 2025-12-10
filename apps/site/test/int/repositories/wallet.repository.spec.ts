import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";
import { eq, and } from "drizzle-orm";
import { WalletRepository } from "@/shared/repositories/wallet.repository";
import { UsersRepository } from "@/shared/repositories/users.repository";
import { HumanRepository } from "@/shared/repositories/human.repository";
import { DealsRepository } from "@/shared/repositories/deals.repository";
import { FinancesRepository } from "@/shared/repositories/finances.repository";
import { schema } from "@/shared/schema";
import { createDb, withNotDeleted } from "@/shared/repositories/utils";
import { LoanApplicationDataIn } from "@/shared/types/esnad";
import { EsnadFinance } from "@/shared/types/esnad-finance";
import { parseJson } from "@/shared/repositories/utils";

describe("WalletRepository - Finance Payment Tests", () => {
  let db: D1Database;
  let walletRepository: WalletRepository;
  let usersRepository: UsersRepository;
  let humanRepository: HumanRepository;
  let dealsRepository: DealsRepository;
  let financesRepository: FinancesRepository;
  let dbInstance: ReturnType<typeof createDb>;

  beforeAll(async () => {
    const platformProxy = await getPlatformProxy({
      configPath: "wrangler.test.toml",
    });

    db = platformProxy.env.DB as D1Database;
    walletRepository = WalletRepository.getInstance();
    usersRepository = UsersRepository.getInstance();
    humanRepository = HumanRepository.getInstance();
    dealsRepository = new DealsRepository();
    financesRepository = FinancesRepository.getInstance();
    dbInstance = createDb();
  });

  describe("findUnpaidFinancesForVerifiedUsers", () => {
    it("should find unpaid finance for users with verified email", async () => {
      // 1. Находим в БД неоплаченные finance для пользователей с подтвержденным email
      const allFinances = await financesRepository.getSelectQuery()
        .where(
          withNotDeleted(
            financesRepository.schema.deletedAt,
            and(eq(financesRepository.schema.statusName, "PENDING"))
          )
        )
        .execute();

      const unpaidFinances: EsnadFinance[] = [];

      for (const finance of allFinances) {
        const dataIn = parseJson<any>(finance.dataIn, null);

        if (!dataIn?.clientAid) {
          continue;
        }

        // Проверяем, что у пользователя подтвержден email
        const [user] = await dbInstance
          .select()
          .from(schema.users)
          .where(
            withNotDeleted(
              schema.users.deletedAt,
              and(eq(schema.users.humanAid, dataIn.clientAid))
            )
          )
          .limit(1)
          .execute();

        if (user && user.emailVerifiedAt) {
          unpaidFinances.push(finance as EsnadFinance);
        }
      }

      expect(unpaidFinances).toBeDefined();
      expect(Array.isArray(unpaidFinances)).toBe(true);

      // Если неоплаченных finance нет, создаем тестовые данные
      if (unpaidFinances.length === 0) {
        // 2. Создаем пользователя с подтвержденным email
        const email = faker.internet.email().toLowerCase();
        const { hashedPassword, salt } = await (
          await import("@/shared/password")
        ).preparePassword("testPassword123!");

        // Создаем клиента
        const client = await humanRepository.generateClientByEmail(email, {
          fullName: faker.person.fullName(),
          dataIn: {
            phone: faker.phone.number({ style: "international" }),
          },
        });

        // Создаем пользователя с подтвержденным email
        const user = await usersRepository.create({
          humanAid: client.haid,
          email: email,
          passwordHash: hashedPassword,
          salt,
          isActive: true,
          emailVerifiedAt: new Date().toISOString(), // Подтверждаем email
        });

        expect(user).toBeDefined();
        expect(user.emailVerifiedAt).toBeDefined();

        // 3. Создаем заявку
        const formData: LoanApplicationDataIn = {
          type: "LOAN_APPLICATION",
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: faker.phone.number({ style: "international" }),
          email: email,
          productPrice: "100000",
          term: [12],
        };

        const dealResult = await dealsRepository.createLoanApplicationDealPublic(formData);
        expect(dealResult.createdDeal).toBeDefined();

        // 4. От лица менеджера подтверждаем заявку
        const deal = await dealsRepository.findByUuid(dealResult.createdDeal.uuid);
        if (deal && deal.statusName !== "APPROVED") {
          await dealsRepository.update(deal.uuid, {
            statusName: "APPROVED",
          });
        }

        // 5. Генерируем график платежей (finance)
        const paymentSchedule = await financesRepository.generateScheduleForDeal(
          dealResult.createdDeal.uuid,
          {
            dealAid: dealResult.createdDeal.daid,
            totalAmount: 100000,
            termMonths: 12,
            firstPaymentDate: new Date().toISOString().split("T")[0] as any,
            timezone: "Europe/Moscow",
            paymentMethod: "CARD",
            limits: {
              minAmount: 3000,
              maxAmount: 300000,
              defaultTermMonths: 12,
              gracePeriodDays: 3,
              penaltyDailyRatePercent: 0.1,
              reminderEnabled: true,
              reminderDaysBefore: [3],
              reminderChannels: ["EMAIL"],
            },
            generatedBy: "SYSTEM",
          }
        );

        expect(paymentSchedule.items.length).toBeGreaterThan(0);

        // Проверяем, что finance созданы
        const createdFinances = await financesRepository.getSelectQuery()
          .where(
            withNotDeleted(
              financesRepository.schema.deletedAt,
              and(
                eq(financesRepository.schema.fullDaid, dealResult.createdDeal.daid),
                eq(financesRepository.schema.statusName, "PENDING")
              )
            )
          )
          .execute();

        expect(createdFinances.length).toBeGreaterThan(0);

        // 6. Для неоплаченных finance делаем платеж новым методом
        const firstFinance = createdFinances[0] as EsnadFinance;
        const firstFinanceAmount = parseFloat(firstFinance.sum || "0");
        const firstFinanceAmountKopecks = Math.floor(firstFinanceAmount * 100);

        // Получаем или создаем кошелек
        const wallet = await walletRepository.getWalletByHumanHaid(client.haid);

        // Начисляем сумму в копейках (больше чем нужно для первого платежа)
        const depositAmountKopecks = firstFinanceAmountKopecks + 10000; // Добавляем запас
        await walletRepository.depositAmount(
          wallet.uuid as string,
          depositAmountKopecks,
          "DEPOSIT",
          "Test payment for finance"
        );

        // 7. Проверяем, что статус finance изменился на PAID
        const updatedFinance = (await financesRepository.findByUuid(
          firstFinance.uuid
        )) as EsnadFinance;

        expect(updatedFinance).toBeDefined();
        expect(updatedFinance.statusName).toBe("PAID");

        // Проверяем, что создана транзакция списания
        const debitTransactions = await dbInstance
          .select()
          .from(schema.walletTransactions)
          .where(
            withNotDeleted(
              schema.walletTransactions.deletedAt,
              and(
                eq(
                  schema.walletTransactions.fullWaid,
                  wallet.fullWaid || `W-${wallet.waid}`
                )
              )
            )
          )
          .execute();

        const debitTransaction = debitTransactions.find((tx: any) => {
          const txDataIn = tx.dataIn && typeof tx.dataIn === "object" ? tx.dataIn : {};
          return txDataIn.type === "DEAL_REPAYMENT" && txDataIn.financeFaid === firstFinance.faid;
        });

        expect(debitTransaction).toBeDefined();
        if (!debitTransaction) {
          throw new Error("Debit transaction not found");
        }
        const expectedAmount = -Math.floor(firstFinanceAmountKopecks / 100);
        expect(parseInt(debitTransaction.amount)).toBe(expectedAmount);
      } else {
        // Если уже есть неоплаченные finance, просто делаем платеж
        const firstUnpaidFinance = unpaidFinances[0];
        const dataIn = firstUnpaidFinance.dataIn && typeof firstUnpaidFinance.dataIn === "object"
          ? firstUnpaidFinance.dataIn as any
          : null;

        if (dataIn?.clientAid) {
          const wallet = await walletRepository.getWalletByHumanHaid(dataIn.clientAid);
          const financeAmount = parseFloat(firstUnpaidFinance.sum || "0");
          const financeAmountKopecks = Math.floor(financeAmount * 100);

          // Начисляем сумму
          await walletRepository.depositAmount(
            wallet.uuid as string,
            financeAmountKopecks + 10000,
            "DEPOSIT",
            "Test payment"
          );

          // Проверяем, что статус изменился
          const updatedFinance = (await financesRepository.findByUuid(
            firstUnpaidFinance.uuid
          )) as EsnadFinance;

          expect(updatedFinance.statusName).toBe("PAID");
        }
      }
    });
  });
});

