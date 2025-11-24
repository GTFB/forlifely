import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";
import { FinancesRepository } from "@/shared/repositories/finances.repository";
import { DealsRepository } from "@/shared/repositories/deals.repository";
import { HumanRepository } from "@/shared/repositories/human.repository";
import { MediaRepository } from "@/shared/repositories/media.repository";
import {
  PaymentScheduleInput,
  PaymentLimitsConfig,
  FinanceDataIn,
  MediaDataIn,
} from "@/shared/types/esnad-finance";
import { LoanApplicationDataIn } from "@/shared/types/esnad";

describe("FinancesRepository", () => {
  let db: D1Database;
  let financesRepository: FinancesRepository;
  let dealsRepository: DealsRepository;
  let humanRepository: HumanRepository;
  let mediaRepository: MediaRepository;

  beforeAll(async () => {
    const platformProxy = await getPlatformProxy({
      configPath: "wrangler.test.toml",
    });

    db = platformProxy.env.DB as D1Database;
    financesRepository = FinancesRepository.getInstance();
    dealsRepository = new DealsRepository();
    humanRepository = HumanRepository.getInstance();
    mediaRepository = MediaRepository.getInstance();
  });

  const defaultLimits: PaymentLimitsConfig = {
    minAmount: 1000,
    maxAmount: 1000000,
    defaultTermMonths: 12,
    gracePeriodDays: 3,
    penaltyDailyRatePercent: 0.1,
    reminderEnabled: true,
    reminderDaysBefore: [3, 1],
    reminderChannels: ["EMAIL", "SMS"],
  };

  async function createDeal() {
    return dealsRepository.createLoanApplicationDealPublic({
      type: "LOAN_APPLICATION",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number({ style: "international" }),
      email: faker.internet.email().toLowerCase(),
      productPrice: "100000",
      term: [12],
    } satisfies LoanApplicationDataIn);
  }

  function pickFinanceByDeal(finances: any[], dealAid: string) {
    return finances.find((finance) => {
      const dataIn = typeof finance.dataIn === "string"
        ? (JSON.parse(finance.dataIn) as FinanceDataIn)
        : (finance.dataIn as FinanceDataIn);
      return dataIn.dealAid === dealAid;
    });
  }

  describe("generateScheduleForDeal", () => {
    it("создает серию финплатежей и возвращает summary", async () => {
      const { createdDeal } = await createDeal();

      const input: PaymentScheduleInput = {
        dealAid: createdDeal.daid,
        totalAmount: 120000,
        upfrontAmount: 20000,
        termMonths: 6,
        firstPaymentDate: new Date().toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      };

      const result = await financesRepository.generateScheduleForDeal(createdDeal.uuid, input);

      expect(result.items).toHaveLength(6);
      expect(result.summary.totalInstallments).toBe(6);

      const allFinances = await financesRepository.findAll();
      const linked = allFinances.filter((finance) => {
        const dataIn = typeof finance.dataIn === "string"
          ? (JSON.parse(finance.dataIn) as FinanceDataIn)
          : (finance.dataIn as FinanceDataIn);
        return dataIn.dealAid === createdDeal.daid;
      });
      expect(linked.length).toBeGreaterThanOrEqual(6);
    });

    it("валидирует соответствие dealAid", async () => {
      const { createdDeal } = await createDeal();
      const input: PaymentScheduleInput = {
        dealAid: "d-other",
        totalAmount: 50000,
        termMonths: 3,
        firstPaymentDate: new Date().toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      };

      await expect(
        financesRepository.generateScheduleForDeal(createdDeal.uuid, input),
      ).rejects.toThrow("Deal AID mismatch");
    });
  });

  describe("markFinanceAsPaid", () => {
    it("меняет статус на PAID и фиксирует факт оплаты", async () => {
      const { createdDeal } = await createDeal();
      const scheduleInput: PaymentScheduleInput = {
        dealAid: createdDeal.daid,
        totalAmount: 60000,
        termMonths: 3,
        firstPaymentDate: new Date().toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      };

      await financesRepository.generateScheduleForDeal(createdDeal.uuid, scheduleInput);
      const targetFinance = pickFinanceByDeal(await financesRepository.findAll(), createdDeal.daid);
      expect(targetFinance).toBeDefined();
      if (!targetFinance) return;

      const paidAt = new Date().toISOString();
      const updatedFinance = await financesRepository.markFinanceAsPaid(targetFinance.uuid, {
        paidAt,
        paidAmount: 20000,
        walletTransactionUuid: crypto.randomUUID(),
      });

      expect(updatedFinance.statusName).toBe("PAID");
      const dataOut = typeof updatedFinance.dataOut === "string"
        ? JSON.parse(updatedFinance.dataOut)
        : updatedFinance.dataOut;
      expect(dataOut.paidAt).toBe(paidAt);
      expect(dataOut.statusHistory.at(-1)?.status).toBe("PAID");
    });

    it("сохраняет чеки как Media", async () => {
      const { createdDeal } = await createDeal();
      await financesRepository.generateScheduleForDeal(createdDeal.uuid, {
        dealAid: createdDeal.daid,
        totalAmount: 60000,
        termMonths: 3,
        firstPaymentDate: new Date().toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      });

      const targetFinance = pickFinanceByDeal(await financesRepository.findAll(), createdDeal.daid);
      expect(targetFinance).toBeDefined();
      if (!targetFinance) return;

      const receipts: MediaDataIn[] = [
        { documentType: "PAYMENT_RECEIPT", dealAid: createdDeal.daid, checksum: "hash" },
      ];

      const updatedFinance = await financesRepository.markFinanceAsPaid(targetFinance.uuid, {
        paidAt: new Date().toISOString(),
        paidAmount: 20000,
        walletTransactionUuid: crypto.randomUUID(),
        receipts,
      });

      const dataOut = typeof updatedFinance.dataOut === "string"
        ? JSON.parse(updatedFinance.dataOut)
        : updatedFinance.dataOut;

      expect(dataOut.receipts?.length).toBe(1);
      const media = await mediaRepository.findByUuid(dataOut.receipts?.[0]?.mediaUuid);
      expect(media).toBeDefined();
    });
  });

  describe("markPendingAsOverdue", () => {
    it("переводит просроченные платежи в статус OVERDUE", async () => {
      const { createdDeal } = await createDeal();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      await financesRepository.generateScheduleForDeal(createdDeal.uuid, {
        dealAid: createdDeal.daid,
        totalAmount: 60000,
        termMonths: 3,
        firstPaymentDate: pastDate.toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      });

      const overdueFinances = await financesRepository.markPendingAsOverdue(
        new Date().toISOString().split("T")[0],
      );

      expect(overdueFinances.length).toBeGreaterThan(0);
      overdueFinances.forEach((finance) => {
        expect(finance.statusName).toBe("OVERDUE");
        const dataOut = typeof finance.dataOut === "string"
          ? JSON.parse(finance.dataOut)
          : finance.dataOut;
        expect(dataOut.overdueDays).toBeGreaterThan(0);
      });
    });

    it("не затрагивает будущие платежи", async () => {
      const { createdDeal } = await createDeal();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await financesRepository.generateScheduleForDeal(createdDeal.uuid, {
        dealAid: createdDeal.daid,
        totalAmount: 60000,
        termMonths: 3,
        firstPaymentDate: futureDate.toISOString().split("T")[0],
        timezone: "Europe/Moscow",
        paymentMethod: "CARD",
        limits: defaultLimits,
        generatedBy: "SYSTEM",
      });

      const overdueFinances = await financesRepository.markPendingAsOverdue(
        new Date().toISOString().split("T")[0],
      );
      expect(overdueFinances.length).toBe(0);
    });
  });
});
 
