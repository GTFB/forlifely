import { and, eq } from 'drizzle-orm'
import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import { Deal, Finance } from '../schema/types'
import { generateAid } from '../generate-aid'
import {
  EsnadFinance,
  FinanceDataIn,
  FinanceDataOut,
  FinanceReceipt,
  FinanceStatusHistoryEntry,
  MediaDataIn,
  NewEsnadFinance,
  PaymentScheduleInput,
  PaymentScheduleResult,
  WalletTransaction,
  IsoDate,
  IsoDateTime,
} from '../types/esnad-finance'
import { parseJson, withNotDeleted } from './utils'
import { DealsRepository } from './deals.repository'
import { MediaRepository } from './media.repository'

export class FinancesRepository extends BaseRepository<Finance> {
  constructor(db: D1Database) {
    super(db, schema.finances)
  }

  public static getInstance(db: D1Database): FinancesRepository {
    return new FinancesRepository(db)
  }

  protected async beforeCreate(data: Partial<NewEsnadFinance>): Promise<void> {
    if (!data.faid) {
      data.faid = generateAid('f')
    }
    if (!data.fullDaid && data.dataIn && typeof data.dataIn === 'object') {
      data.fullDaid = data.dataIn.dealAid
    }
    if (!data.statusName) {
      data.statusName = 'PENDING'
    }
  }

  protected async beforeUpdate(_: string, data: Partial<NewEsnadFinance>): Promise<void> {
    return
  }

  public async generateScheduleForDeal(
    dealUuid: string,
    input: PaymentScheduleInput
  ): Promise<PaymentScheduleResult> {
    const dealsRepo = new DealsRepository(this.d1DB)
    const deal = (await dealsRepo.findByUuid(dealUuid)) as Deal | null

    if (!deal) {
      throw new Error(`Deal with uuid ${dealUuid} not found`)
    }

    if (input.dealAid !== deal.daid) {
      throw new Error(
        `Deal AID mismatch: input.dealAid (${input.dealAid}) does not match deal.daid (${deal.daid})`
      )
    }

    const remainingAmount = input.totalAmount - (input.upfrontAmount ?? 0)
    const termMonths = input.termMonths
    const monthlyPayment = remainingAmount / termMonths

    const principalPerPayment = remainingAmount * 0.7 / termMonths
    const profitSharePerPayment = remainingAmount * 0.25 / termMonths
    const serviceFeePerPayment = remainingAmount * 0.05 / termMonths

    const firstDate = new Date(input.firstPaymentDate)
    const paymentDates: Date[] = []

    for (let i = 0; i < termMonths; i++) {
      const paymentDate = new Date(firstDate)
      paymentDate.setMonth(paymentDate.getMonth() + i)
      paymentDates.push(paymentDate)
    }

    const scheduleItems: FinanceDataIn[] = []

    for (let i = 0; i < termMonths; i++) {
      const paymentNumber = i + 1
      const paymentDate = paymentDates[i]

      const financeDataIn: FinanceDataIn = {
        paymentNumber,
        paymentDate: paymentDate.toISOString().split('T')[0] as IsoDate,
        totalAmount: monthlyPayment,
        principalAmount: principalPerPayment,
        profitShareAmount: profitSharePerPayment,
        serviceFeeAmount: serviceFeePerPayment,
        autoDebitEnabled: input.paymentMethod === 'INTERNAL_WALLET',
        preferredPaymentChannel: input.paymentMethod,
        reminderScheduleDays: input.limits.reminderDaysBefore,
        dealAid: input.dealAid,
        clientAid: deal.clientAid as string | null,
        generatedBy: input.generatedBy === 'ADMIN' ? 'MANUAL' : input.generatedBy,
      }

      scheduleItems.push(financeDataIn)

      const newFinance: NewEsnadFinance = {
        uuid: crypto.randomUUID(),
        faid: generateAid('f'),
        fullDaid: input.dealAid,
        title: `Payment ${paymentNumber} for deal ${input.dealAid}`,
        sum: monthlyPayment.toString(),
        currencyId: 'RUB',
        cycle: 'MONTHLY',
        type: 'INSTALLMENT',
        statusName: 'PENDING',
        order: paymentNumber.toString(),
        dataIn: financeDataIn,
        dataOut: {
          statusHistory: [
            {
              status: 'PENDING',
              changedAt: new Date().toISOString(),
              source: 'SYSTEM',
            },
          ],
        },
      }

      await this.create(newFinance)
    }

    return {
      items: scheduleItems,
      summary: {
        totalInstallments: termMonths,
        totalPrincipal: principalPerPayment * termMonths,
        totalProfitShare: profitSharePerPayment * termMonths,
        totalServiceFees: serviceFeePerPayment * termMonths,
        nextPaymentDate: paymentDates[0].toISOString().split('T')[0] as IsoDate,
      },
    }
  }

  public async markFinanceAsPaid(
    financeUuid: string,
    payload: {
      paidAt: IsoDateTime
      paidAmount: number
      walletTransactionUuid: WalletTransaction['uuid']
      receipts?: MediaDataIn[]
    }
  ): Promise<EsnadFinance> {
    const finance = (await this.findByUuid(financeUuid)) as EsnadFinance | null

    if (!finance) {
      throw new Error(`Finance with uuid ${financeUuid} not found`)
    }

    const dataOut = parseJson<FinanceDataOut>(
      finance.dataOut,
      {
        statusHistory: [],
      }
    )

    const statusHistoryEntry: FinanceStatusHistoryEntry = {
      status: 'PAID',
      changedAt: payload.paidAt,
      source: 'SYSTEM',
    }

    const updatedStatusHistory = [...dataOut.statusHistory, statusHistoryEntry]

    const receipts: FinanceReceipt[] = dataOut.receipts ?? []

    if (payload.receipts?.length) {
      const mediaRepo = MediaRepository.getInstance(this.d1DB)

      for (const receiptData of payload.receipts) {
        const media = await mediaRepo.create({
          uuid: crypto.randomUUID(),
          title: `Payment receipt for finance ${finance.faid}`,
          dataIn: {
            ...receiptData,
            documentType: 'PAYMENT_RECEIPT',
            financeFaid: finance.faid,
            dealAid: receiptData.dealAid ?? finance.fullDaid ?? undefined,
          },
        })

        receipts.push({
          mediaUuid: media.uuid,
          uploadedAt: payload.paidAt,
          filename: media.fileName || media.filename || 'receipt',
        })
      }
    }

    const updatedFinance = (await this.update(financeUuid, {
      statusName: 'PAID',
      dataOut: {
        ...dataOut,
        paidAt: payload.paidAt,
        paidAmount: payload.paidAmount,
        walletTransactionUuid: payload.walletTransactionUuid,
        statusHistory: updatedStatusHistory,
        receipts,
      },
    })) as EsnadFinance

    return updatedFinance
  }

  public async markPendingAsOverdue(referenceDate: IsoDate): Promise<EsnadFinance[]> {
    const referenceDateTime = new Date(referenceDate)
    const referenceDateOnly = new Date(
      referenceDateTime.getFullYear(),
      referenceDateTime.getMonth(),
      referenceDateTime.getDate()
    )

    const pendingFinances = await this.db
      .select()
      .from(schema.finances)
      .where(
        withNotDeleted(
          schema.finances.deletedAt,
          and(eq(schema.finances.statusName, 'PENDING'))
        )
      )
      .execute()

    const overdueFinances: EsnadFinance[] = []

    for (const finance of pendingFinances) {
      const dataIn = parseJson<FinanceDataIn | null>(finance.dataIn, null)

      if (!dataIn?.paymentDate) {
        continue
      }

      const paymentDate = new Date(dataIn.paymentDate)
      const paymentDateOnly = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth(),
        paymentDate.getDate()
      )

      if (paymentDateOnly < referenceDateOnly) {
        const existingDataOut = parseJson<FinanceDataOut>(
          finance.dataOut,
          {
            statusHistory: [],
          }
        )

        const overdueDays = Math.floor(
          (referenceDateOnly.getTime() - paymentDateOnly.getTime()) / (1000 * 60 * 60 * 24)
        )

        const statusHistoryEntry: FinanceStatusHistoryEntry = {
          status: 'OVERDUE',
          changedAt: new Date().toISOString(),
          source: 'AUTO_RULE',
          comment: `Automatically marked as overdue. Payment date: ${dataIn.paymentDate}`,
        }

        const updatedFinance = (await this.update(finance.uuid, {
          statusName: 'OVERDUE',
          dataOut: {
            ...existingDataOut,
            overdueDays,
            statusHistory: [...existingDataOut.statusHistory, statusHistoryEntry],
          },
        })) as EsnadFinance

        overdueFinances.push(updatedFinance)
      }
    }

    return overdueFinances
  }
}

