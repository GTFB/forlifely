import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import { Notice } from '../schema/types'
import { generateAid } from '../generate-aid'
import {
  EsnadNotice,
  NewEsnadNotice,
  NoticeDataIn,
  PaymentReminderChannel,
} from '../types/esnad-finance'

export class NoticesRepository extends BaseRepository<Notice> {
  constructor() {
    super(schema.notices)
  }

  public static getInstance(): NoticesRepository {
    return new NoticesRepository()
  }

  protected async beforeCreate(data: Partial<NewEsnadNotice>): Promise<void> {
    if (!data.naid) {
      data.naid = generateAid('n')
    }
    if (typeof data.isRead === 'undefined') {
      data.isRead = 0
    }
  }

  protected async beforeUpdate(_: string, data: Partial<NewEsnadNotice>): Promise<void> {
    return
  }

  public async queuePaymentNotice(data: NoticeDataIn): Promise<EsnadNotice> {
    let typeName = data.triggerReason
    let title = 'Уведомление'

    const amountVar = data.variables?.find((v) => v.key === 'amount')
    const paymentDateVar = data.variables?.find((v) => v.key === 'paymentDate')
    const overdueDaysVar = data.variables?.find((v) => v.key === 'overdueDays')

    switch (data.triggerReason) {
      case 'PAYMENT_REMINDER':
        title = amountVar && paymentDateVar
          ? `Напоминание: платеж ${amountVar.value} руб. до ${paymentDateVar.value}`
          : 'Напоминание о предстоящем платеже'
        typeName = 'PAYMENT_REMINDER'
        break
      case 'PAYMENT_RECEIVED':
        title = 'Платеж получен'
        typeName = 'PAYMENT_RECEIVED'
        break
      case 'DEBT_COLLECTION':
        title = amountVar && overdueDaysVar
          ? `Просрочка платежа: ${amountVar.value} руб. (${overdueDaysVar.value} дней)`
          : 'Уведомление о просрочке'
        typeName = 'DEBT_COLLECTION'
        break
      case 'DEAL_STATUS':
        title = 'Изменение статуса сделки'
        typeName = 'DEAL_STATUS'
        break
      default:
        title = 'Уведомление'
        typeName = 'CUSTOM'
    }

    const targetAid = data.variables?.find((v) => v.key === 'clientAid')?.value as string | undefined

    const createdNotice = (await this.create({
      uuid: crypto.randomUUID(),
      naid: generateAid('n'),
      targetAid,
      title,
      isRead: 0,
      typeName,
      order: '0',
      dataIn: data,
    })) as EsnadNotice

    return createdNotice
  }

  public async createPaymentReminder(
    channel: PaymentReminderChannel,
    clientAid: string,
    dealAid: string,
    financeFaid: string,
    amount: number,
    paymentDate: string,
    daysBefore: number
  ): Promise<EsnadNotice> {
    return this.queuePaymentNotice({
      channel,
      templateKey: `payment_reminder_${daysBefore}_days`,
      variables: [
        { key: 'clientAid', value: clientAid },
        { key: 'dealAid', value: dealAid },
        { key: 'financeFaid', value: financeFaid },
        { key: 'amount', value: amount },
        { key: 'paymentDate', value: paymentDate },
        { key: 'daysBefore', value: daysBefore },
      ],
      relatedDealAid: dealAid,
      relatedFinanceFaid: financeFaid,
      triggeredBy: 'SYSTEM',
      triggerReason: 'PAYMENT_REMINDER',
    })
  }

  public async createOverdueNotice(
    channel: PaymentReminderChannel,
    clientAid: string,
    dealAid: string,
    financeFaid: string,
    amount: number,
    overdueDays: number
  ): Promise<EsnadNotice> {
    return this.queuePaymentNotice({
      channel,
      templateKey: 'payment_overdue',
      variables: [
        { key: 'clientAid', value: clientAid },
        { key: 'dealAid', value: dealAid },
        { key: 'financeFaid', value: financeFaid },
        { key: 'amount', value: amount },
        { key: 'overdueDays', value: overdueDays },
      ],
      relatedDealAid: dealAid,
      relatedFinanceFaid: financeFaid,
      triggeredBy: 'SYSTEM',
      triggerReason: 'DEBT_COLLECTION',
    })
  }
}

