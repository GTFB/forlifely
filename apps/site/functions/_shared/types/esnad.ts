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
} from '../schema/types'
export interface EsnadHuman extends Human {
    dataIn: EsnadHumanData

}


export interface NewEsnadHuman extends NewHuman {
    dataIn: EsnadHumanData
}

export interface EsnadHumanData {
    phone?: string
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
export interface EsnadUserData {

}/**
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
    //dealStatusTransitions?: LoanApplicationJournal[]
    documents?: any[]
}

export interface NewLoanApplication extends NewDeal {
    dataIn: LoanApplicationDataIn
    statusName: LoanApplicationStatus
    //dealStatusTransitions?: LoanApplicationJournal[]
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
}

export interface AdditionalInfoRequest {
    comment: string
}

export interface JournalLoanApplicationSnapshot extends Journal {
    action: 'LOAN_APPLICATION_SNAPSHOT'
    userId?: User['id']
    details: LoanApplicationSnapshotDetails
}
export interface NewJournalLoanApplicationSnapshot extends NewJournal {
    action: 'LOAN_APPLICATION_SNAPSHOT'
    userId?: User['id']
    details: LoanApplicationSnapshotDetails
}

export interface LoanApplicationSnapshotDetails {
    snapshot: LoanApplication
    previousSnapshot: LoanApplication | null
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
export interface ClientDataIn extends EsnadHumanData {

}
