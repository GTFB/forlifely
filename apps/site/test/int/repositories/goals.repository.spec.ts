import { describe, it, beforeAll, expect } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { faker } from "@faker-js/faker";
import { GoalsRepository } from "@/shared/repositories/goals.repository";
import { FinancesRepository } from "@/shared/repositories/finances.repository";
import { DealsRepository } from "@/shared/repositories/deals.repository";
import { HumanRepository } from "@/shared/repositories/human.repository";
import {
  CollectionGoalDataIn,
  EsnadFinance,
  FinanceDataIn,
  FinanceStatus,
} from "@/shared/types/esnad-finance";
import { LoanApplicationDataIn } from "@/shared/types/esnad";

describe("GoalsRepository", () => {
  let db: D1Database;
  let goalsRepository: GoalsRepository;
  let financesRepository: FinancesRepository;
  let dealsRepository: DealsRepository;
  let humanRepository: HumanRepository;

  beforeAll(async () => {
    const platformProxy = await getPlatformProxy({
      configPath: "wrangler.test.toml",
    });

    db = platformProxy.env.DB as D1Database;
    goalsRepository = GoalsRepository.getInstance(db);
    financesRepository = FinancesRepository.getInstance(db);
    dealsRepository = new DealsRepository(db);
    humanRepository = HumanRepository.getInstance(db);
  });

  async function createFinance(overdueDays: number): Promise<{ finance: EsnadFinance; dealAid: string; clientAid: string | null }> {
    const { createdDeal } = await dealsRepository.createLoanApplicationDealPublic({
      type: "LOAN_APPLICATION",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number({ style: "international" }),
      email: faker.internet.email().toLowerCase(),
      productPrice: "100000",
      term: [12],
    } satisfies LoanApplicationDataIn);

    const createdFinance = await financesRepository.create({
      uuid: crypto.randomUUID(),
      faid: `f-${faker.string.alphanumeric(6)}`,
      fullDaid: createdDeal.daid,
      title: "Test payment",
      sum: "7500",
      currencyId: "RUB",
      cycle: "MONTHLY",
      type: "INSTALLMENT",
      statusName: "OVERDUE",
      order: "1",
      dataIn: {
        paymentNumber: 1,
        paymentDate: new Date().toISOString().split("T")[0],
        totalAmount: 7500,
        principalAmount: 5250,
        profitShareAmount: 1875,
        serviceFeeAmount: 375,
        autoDebitEnabled: false,
        preferredPaymentChannel: "CARD",
        reminderScheduleDays: [3, 1],
        dealAid: createdDeal.daid,
        clientAid: createdDeal.clientAid as string | null,
        generatedBy: "SYSTEM",
      },
      dataOut: {
        statusHistory: [],
        overdueDays,
      },
    });
    
    const financeData = createdFinance as EsnadFinance;

    return { finance: financeData, dealAid: createdDeal.daid, clientAid: createdDeal.clientAid as string | null };
  }

  describe("createCollectionGoalFromFinance", () => {
    it("создает задачу CLIENT_CALL для просрочки до 3 дней", async () => {
      const { finance, dealAid, clientAid } = await createFinance(2);

      const goal = await goalsRepository.createCollectionGoalFromFinance(finance, {
        type: "CLIENT_CALL",
        stage: "CLIENT_CALL",
        priority: "MEDIUM",
        dealAid,
        financeFaid: finance.faid,
        clientAid,
        overdueDays: 2,
        assigneeGroup: "COLLECTION",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        autoCreated: true,
      });

      expect(goal.title).toContain("Звонок клиенту");

      const dataIn = typeof goal.dataIn === "string" ? JSON.parse(goal.dataIn) : goal.dataIn;
      expect(dataIn.type).toBe("CLIENT_CALL");
      expect(dataIn.stage).toBe("CLIENT_CALL");
      expect(dataIn.instructions).toContain("Связаться с клиентом");
    });

    it("создает задачу GUARANTOR_CALL для просрочки до 5 дней", async () => {
      const { finance, dealAid, clientAid } = await createFinance(4);

      const goal = await goalsRepository.createCollectionGoalFromFinance(finance, {
        type: "GUARANTOR_CALL",
        stage: "GUARANTOR_CALL",
        priority: "HIGH",
        dealAid,
        financeFaid: finance.faid,
        clientAid,
        overdueDays: 4,
        assigneeGroup: "COLLECTION",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        autoCreated: true,
      });

      const dataIn = typeof goal.dataIn === "string" ? JSON.parse(goal.dataIn) : goal.dataIn;
      expect(dataIn.type).toBe("GUARANTOR_CALL");
      expect(dataIn.instructions).toContain("поручителем");
    });

    it("создает задачу FIELD_VISIT для просрочки 5-10 дней", async () => {
      const { finance, dealAid, clientAid } = await createFinance(7);

      const goal = await goalsRepository.createCollectionGoalFromFinance(finance, {
        type: "FIELD_VISIT",
        stage: "FIELD_VISIT",
        priority: "HIGH",
        dealAid,
        financeFaid: finance.faid,
        clientAid,
        overdueDays: 7,
        assigneeGroup: "COLLECTION",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        autoCreated: true,
      });

      const dataIn = typeof goal.dataIn === "string" ? JSON.parse(goal.dataIn) : goal.dataIn;
      expect(dataIn.type).toBe("FIELD_VISIT");
      expect(dataIn.instructions.toLowerCase()).toContain("выезд службы безопасности");
    });

    it("создает задачу LEGAL_NOTICE при просрочке более 10 дней", async () => {
      const { finance, dealAid, clientAid } = await createFinance(15);

      const goal = await goalsRepository.createCollectionGoalFromFinance(finance, {
        type: "LEGAL_NOTICE",
        stage: "SECURITY_ESCALATION",
        priority: "CRITICAL",
        dealAid,
        financeFaid: finance.faid,
        clientAid,
        overdueDays: 15,
        assigneeGroup: "COLLECTION",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        autoCreated: true,
      });

      const dataIn = typeof goal.dataIn === "string" ? JSON.parse(goal.dataIn) : goal.dataIn;
      expect(dataIn.type).toBe("LEGAL_NOTICE");
      expect(dataIn.instructions).toContain("Критическая просрочка");
    });

    it("использует кастомные данные, если они переданы", async () => {
      const { finance, dealAid, clientAid } = await createFinance(2);

      const goal = await goalsRepository.createCollectionGoalFromFinance(finance, {
        type: "CLIENT_CALL",
        stage: "CLIENT_CALL",
        priority: "LOW",
        dealAid,
        financeFaid: finance.faid,
        clientAid,
        overdueDays: 2,
        assigneeGroup: "CUSTOM",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        autoCreated: true,
        instructions: "Custom instructions",
      });

      const dataIn = typeof goal.dataIn === "string" ? JSON.parse(goal.dataIn) : goal.dataIn;
      expect(dataIn.assigneeGroup).toBe("CUSTOM");
      expect(dataIn.instructions).toBe("Custom instructions");
    });
  });
});