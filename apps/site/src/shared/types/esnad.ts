import {
    Deal,
    User,
    Human,
    NewDeal,
    NewHuman,
    Journal,
    NewJournal,
    Employee,
    NewUser,
    NewText,
    Text,
} from '../schema/types'
import { EsnadMedia } from './esnad-finance'

export interface EsnadHuman extends Human {
    dataIn: EsnadHumanData
    user?: EsnadUser
}

export interface EsnadUser extends User {
    human?: EsnadHuman
}

export interface NewEsnadHuman extends NewHuman {
    dataIn: EsnadHumanData
}

export interface EsnadHumanData {
    phone?: string
    avatarMedia?: Partial<EsnadMedia> | null
    firstName?: string
    lastName?: string
    middleName?: string
}

export interface DealDataIn {
    type: string
}

/**
 * пользователь
 */
export interface EsnadUser extends User {
    dataIn: EsnadUserData
}
export interface NewEsnadUser extends NewUser {
    dataIn: EsnadUserData
}
export interface EmailVerificationState {
    tokenHash?: string
    expiresAt?: string
    lastSentAt?: string
}

export interface EsnadUserData {
    emailVerification?: EmailVerificationState
    [key: string]: unknown
}
export interface EsnadJournal extends Journal {
}
export interface NewEsnadJournal extends NewJournal {
}
export interface EsnadJournalDataIn {
    [key: string]: unknown
}
export interface EsnadUserJournal extends EsnadJournal {
    action: EsnadUserJournalActions
    details: EsnadUserJournalDetails

}
export interface NewEsnadUserJournal extends NewEsnadJournal {
    action: EsnadUserJournalActions
    details: EsnadUserJournalDetails
}
export type EsnadUserJournalActions = 
    'USER_JOURNAL_REGISTRATION' |
    'USER_JOURNAL_LOGIN' |
    'USER_JOURNAL_LOGOUT' |
    'USER_JOURNAL_EMAIL_VERIFICATION' |
    'USER_JOURNAL_PASSWORD_RESET_REQUEST' |
    'USER_JOURNAL_PASSWORD_RESET_CONFIRM' |
    'USER_JOURNAL_PASSWORD_RESET' |
    'USER_JOURNAL_SELFIE_VERIFICATION' |
    'USER_JOURNAL_WALLET_DEPOSIT' |
    'USER_JOURNAL_FINANCE_PAID' |
    'USER_JOURNAL_SUPPORT_CHAT_CREATED' |
    'USER_JOURNAL_ADMIN_OCR_OVERRIDE'
export interface EsnadUserJournalDetails {
    user: {
        uuid: string
        email: string
        humanAid?: string | null
    }
    [key: string]: unknown
}
/**
 * форма на странице инвестора
 */
export interface InvestorsFormDeal extends Deal {
    dataIn: InvestorsFormDealDataIn
}

export interface NewInvestorsFormDeal extends NewDeal {
    dataIn: InvestorsFormDealDataIn
}
export interface InvestorsFormDealDataIn {
    type: 'INVESTORS_FORM'
    formData: InvestorsFormData
}
/**
 * Данный из формы на странице /investors
 * 
 */
export interface InvestorsFormData {
    name: string
    phone: string
    email: string
}

/**
 * заявки обработка и формирование платежей через финансы
 */



export interface LoanApplication extends Deal {
    dataIn: LoanApplicationDataIn
    statusName: LoanApplicationStatus
    documents?: any[]
}

export interface NewLoanApplication extends NewDeal {
    dataIn: LoanApplicationDataIn
    statusName: LoanApplicationStatus
    documents?: any[]
}

export interface LoanApplicationDataIn {
    type: 'LOAN_APPLICATION'
    managerUuid?: EsnadUser['uuid']
    firstName: string
    lastName: string
    phone: string
    email: string
    productPrice: string
    term: number[]
    decision?: LoanApplicationDecision
    additionalInfoRequest?: AdditionalInfoRequest
    // Priority fields
    priority?: 'low' | 'medium' | 'high'
    priorityReason?: string
    priorityUpdatedAt?: string
    priorityUpdatedByUserUuid?: string
    // Additional optional fields
    middleName?: string
    productName?: string
    purchaseLocation?: string
    downPayment?: string
    comfortableMonthlyPayment?: string
    monthlyPayment?: string
    partnerLocation?: string
    convenientPaymentDate?: string
    // Financial information (Security Review - СБ)
    officialIncome_sb?: string
    additionalIncome_sb?: string
    employmentInfo_sb?: string
    // Guarantor (optional, provided by client form)
    guarantorFullName?: string
    guarantorPhone?: string
    guarantorRelationship?: string
    guarantorIncome?: string
    guarantorAid?: string
    [key: string]: any // Allow additional fields for flexibility
}

export interface AdditionalInfoRequest {
    comment: string
}

export interface JournalLoanApplicationSnapshot extends Journal {
    action: 'LOAN_APPLICATION_SNAPSHOT' | 'DEAL_APPROVED' | 'DEAL_STATUS_CHANGE' | 'DEAL_REJECTED' | 'DEAL_CANCELLED'
    userId?: User['id']
    details: LoanApplicationSnapshotDetails
}
export interface NewJournalLoanApplicationSnapshot extends NewJournal {
    action: 'LOAN_APPLICATION_SNAPSHOT' | 'DEAL_APPROVED' | 'DEAL_STATUS_CHANGE' | 'DEAL_REJECTED' | 'DEAL_CANCELLED'
    userId?: User['id']
    details: LoanApplicationSnapshotDetails
}

export interface LoanApplicationSnapshotDetails {
    snapshot: LoanApplication
    previousSnapshot: LoanApplication | null
    description?: string
    statusName?: string
}

export type LoanApplicationDeal = LoanApplication

// Deal lifecycle statuses
export type DealStatus =
    | 'NEW'
    | 'SCORING'
    | 'INFO_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'OVERDUE'
// Deal lifecycle statuses
export type LoanApplicationStatus =
    | 'NEW'
    | 'SCORING'
    | 'APPROVED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'ACTIVE'
    | 'ADDITIONAL_INFO_REQUESTED'

export interface LoanApplicationDecision {
    securityServiceComment?: string
}
export interface FinanceParameters {

}
export interface PaymentScheduleItem {

}
export interface FinanceSchedule {

}
export interface GenerateFinanceScheduleInput {

}
export interface GenerateFinanceScheduleResult {

}

// export interface LoanApplicationJournal extends Journal{
//     action: 'DEAL_STATUS_TRANSITION'
//     details: DealStatusTransition
// }
// export interface NewLoanApplicationJournal extends NewJournal{
//     action: 'DEAL_STATUS_TRANSITION'
//     details: DealStatusTransition
// }
// export interface DealStatusTransition{
//     type: 'DEAL_STATUS_TRANSITION'
//     dealId: Deal['id']
//     from: DealStatus
//     to: DealStatus
//     performedByUserId: User['id']
//     performedAt: string // ISO datetime
//     reason?: string
//     comment?: string
//     source?: 'MANUAL' | 'SYSTEM' | 'AUTO_RULE'
//     journalId?: Journal['id']
// }
/**
 * taxonomy
 */

export interface TaxonomyOption {
    id: number
    entity: string
    name: string
    title: string | null
    sortOrder: number | null
}

export interface TaxonomyResponse {
    docs: TaxonomyOption[]
}

/**
 * клиент
 */

export type ClientStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface Client extends EsnadHuman {
    dataIn: ClientDataIn
    statusName: ClientStatus
    type: 'CLIENT'
}
export interface NewClient extends NewEsnadHuman {
    dataIn: ClientDataIn
    statusName: ClientStatus
    type: 'CLIENT'
}
/**
 * Investor
 */
export interface Investor extends EsnadHuman {
    dataIn: InvestorDataIn
    statusName: InvestorStatus
    type: 'INVESTOR'
    haid: string
}
export interface NewInvestor extends NewEsnadHuman {
    dataIn: InvestorDataIn
    statusName: InvestorStatus
    type: 'INVESTOR'
    haid: string
}
export interface InvestorDataIn extends EsnadHumanData {
    kycStatus?: KycStatus
    kycDocuments?: KycDocumentRef[]
}
export type InvestorStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
  
/**
 * KYC Status types
 */
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'more_info'

/**
 * KYC Document Reference
 */
export interface KycDocumentRef {
    mediaUuid: string
    type: 'passport_main' | 'passport_registration' | 'selfie' | 'selfie_with_passport' | 'other'
    uploadedAt: string // ISO string
    verificationResult?: {
        facesMatch?: boolean
        confidence?: number
        details?: string
    }
}

export interface ClientDataIn extends EsnadHumanData {
    kycStatus?: KycStatus
    kycDocuments?: KycDocumentRef[]
}

/**
 * API Response types
 */
export interface UploadAssetResponse {
    success: boolean
    asset: {
        uuid: string
        url: string // /api/esnad/v1/c/assets/uuid-filename.ext
        mimeType: string
        fileName: string
    }
}

export interface UpdateProfileKycRequest {
    kycDocuments: KycDocumentRef[]
}

export interface EsnadText extends Text {
    dataIn: EsnadTextDataIn
}
export interface NewEsnadText extends Partial<NewText> {
    dataIn: EsnadTextDataIn
}

export interface EsnadTextDataIn {
    slug: string
    date: string
    author: string
    readTime: number
}