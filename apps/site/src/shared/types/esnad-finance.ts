import {
  Deal,
  Finance,
  Goal,
  Human,
  Media,
  NewFinance,
  NewGoal,
  NewMedia,
  NewNotice,
  NewRelation,
  NewSetting,
  Notice,
  Relation,
  Setting,
  WalletTransaction,
} from '../schema/types'

export type { WalletTransaction }

export type IsoDate = string
export type IsoDateTime = string

export type FinanceStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export type PaymentChannel = 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'INTERNAL_WALLET'

export type PaymentReminderChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM'

export type CollectionStage =
  | 'REMINDER_DAY_1'
  | 'REMINDER_DAY_2'
  | 'CLIENT_CALL'
  | 'GUARANTOR_CALL'
  | 'FIELD_VISIT'
  | 'SECURITY_ESCALATION'
  | 'CLOSED'

export type CollectionGoalType = 'CLIENT_CALL' | 'GUARANTOR_CALL' | 'FIELD_VISIT' | 'LEGAL_NOTICE'

export type CollectionGoalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface FinanceStatusHistoryEntry {
  status: FinanceStatus
  changedAt: IsoDateTime
  changedByUserUuid?: string
  comment?: string
  source: 'SYSTEM' | 'USER' | 'AUTO_RULE'
}

export interface FinancePenaltyInfo {
  graceDaysUsed: number
  dailyRatePercent: number
  totalPenaltyAmount: number
  calculatedAt: IsoDateTime
  reason?: string
}

export interface FinanceReceipt {
  mediaUuid: Media['uuid']
  uploadedAt: IsoDateTime
  uploadedByUserUuid?: string
  filename: string
}

export interface AutoDebitAttempt {
  attemptedAt: IsoDateTime
  channel: PaymentChannel
  amount: number
  status: 'SUCCESS' | 'FAILED'
  failureReason?: string
}

export interface PaymentIntent {
  initiatedAt: IsoDateTime
  channel: PaymentChannel
  amount: number
  status: 'INITIATED' | 'SUCCEEDED' | 'FAILED'
  walletTransactionUuid?: WalletTransaction['uuid']
  failureCode?: string
}

export interface FinanceDataIn {
  paymentNumber: number
  paymentDate: IsoDate
  totalAmount: number
  principalAmount: number
  profitShareAmount: number
  serviceFeeAmount?: number
  partnerCommissionAmount?: number
  autoDebitEnabled: boolean
  preferredPaymentChannel: PaymentChannel
  reminderScheduleDays: number[]
  dealAid: Deal['daid']
  clientAid: Human['haid'] | null
  walletDebitAid?: string
  walletCreditAid?: string
  generatedBy: 'SYSTEM' | 'MIGRATION' | 'MANUAL'
  notes?: string
}

export interface FinanceDataOut {
  paidAt?: IsoDateTime
  paidAmount?: number
  walletTransactionUuid?: WalletTransaction['uuid']
  penalty?: FinancePenaltyInfo
  statusHistory: FinanceStatusHistoryEntry[]
  receipts?: FinanceReceipt[]
  lastReminderSentAt?: IsoDateTime
  overdueDays?: number
  collectionStage?: CollectionStage
  autoDebitAttempts?: AutoDebitAttempt[]
  paymentIntents?: PaymentIntent[]
}

export interface EsnadFinance extends Finance {
  statusName: FinanceStatus
  dataIn: FinanceDataIn
  dataOut: FinanceDataOut | null
}

export interface NewEsnadFinance extends NewFinance {
  statusName: FinanceStatus
  dataIn: FinanceDataIn
  dataOut?: FinanceDataOut | null
}

export interface CollectionGoalDataIn {
  type: CollectionGoalType
  stage: CollectionStage
  priority: CollectionGoalPriority
  dealAid: Deal['daid']
  financeFaid: Finance['faid']
  clientAid: Human['haid'] | null
  overdueDays: number
  assigneeGroup: string
  deadline: IsoDateTime
  autoCreated: boolean
  relatedHumanAid?: Human['haid']
  instructions?: string
}

export interface EsnadGoal extends Goal {
  dataIn: CollectionGoalDataIn
}

export interface NewEsnadGoal extends NewGoal {
  dataIn: CollectionGoalDataIn
}

export interface NoticePayloadVariable {
  key: string
  value: string | number
}

export type NoticeTriggerReason =
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'DEAL_STATUS'
  | 'DEBT_COLLECTION'
  | 'CUSTOM'

export interface NoticeDataIn {
  channel: PaymentReminderChannel
  templateKey: string
  variables: NoticePayloadVariable[]
  relatedDealAid?: Deal['daid']
  relatedFinanceFaid?: Finance['faid']
  triggeredBy: 'SYSTEM' | 'USER'
  triggerReason: NoticeTriggerReason
  sendAfter?: IsoDateTime
  retryCount?: number
}

export interface EsnadNotice extends Notice {
  dataIn: NoticeDataIn
}

export interface NewEsnadNotice extends NewNotice {
  dataIn: NoticeDataIn
}

export interface SettingMetadataOption {
  value: string
  label: string
  description?: string
}

export interface SettingMetadata {
  label: string
  description?: string
  unit?: 'RUB' | 'PERCENT' | 'DAY' | 'BOOLEAN' | string
  group?: 'finance' | 'penalty' | 'notifications' | 'general'
  min?: number
  max?: number
  defaultValue?: string | number | boolean
  isReadOnly?: boolean
  options?: SettingMetadataOption[]
  tags?: string[]
}

export interface EsnadSetting extends Setting {
  dataIn: SettingMetadata
}

export interface NewEsnadSetting extends NewSetting {
  dataIn: SettingMetadata
}

export type MediaDocumentType =
  | 'PASSPORT_SCAN'
  | 'AGREEMENT'
  | 'PAYMENT_RECEIPT'
  | 'KYC_DOCUMENT'
  | 'OTHER'

export interface MediaDataIn {
  documentType?: MediaDocumentType
  dealAid?: Deal['daid']
  financeFaid?: Finance['faid']
  relatedHumanAid?: Human['haid']
  checksum?: string
  tags?: string[]
  uploadedByUserUuid?: string
}

export interface EsnadMedia extends Media {
  dataIn: MediaDataIn
}

export interface NewEsnadMedia extends NewMedia {
  dataIn: MediaDataIn
}

export type RelationContext =
  | 'GUARANTOR'
  | 'KYC_DOCUMENT'
  | 'FINANCE_ATTACHMENT'
  | 'DEAL_ATTACHMENT'
  | 'CUSTOM'

export interface RelationDataIn {
  context: RelationContext
  visibility?: 'internal' | 'external'
  createdByUserUuid?: string
  notes?: string
}

export interface EsnadRelation extends Relation {
  dataIn: RelationDataIn
}

export interface NewEsnadRelation extends NewRelation {
  dataIn: RelationDataIn
}

export interface PaymentLimitsConfig {
  minAmount: number
  maxAmount: number
  defaultTermMonths: number
  gracePeriodDays: number
  penaltyDailyRatePercent: number
  reminderEnabled: boolean
  reminderDaysBefore: number[]
  reminderChannels: PaymentReminderChannel[]
}

export interface PaymentScheduleInput {
  dealAid: Deal['daid']
  totalAmount: number
  upfrontAmount?: number
  termMonths: number
  firstPaymentDate: IsoDate
  timezone: string
  paymentMethod: PaymentChannel
  limits: PaymentLimitsConfig
  generatedBy: 'SYSTEM' | 'ADMIN'
}

export interface PaymentScheduleSummary {
  totalInstallments: number
  totalPrincipal: number
  totalProfitShare: number
  totalServiceFees: number
  nextPaymentDate: IsoDate
}

export interface PaymentScheduleResult {
  items: FinanceDataIn[]
  summary: PaymentScheduleSummary
}

