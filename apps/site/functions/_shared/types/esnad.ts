import {
    Deal,
    User,
    Human,
    NewDeal,
    NewHuman,
    Journal,
    NewJournal,
} from '../schema/types'
export interface EsnadHuman extends Human{
    
}


export interface NewEsnadHuman extends NewHuman{

}

export interface DealDataIn{
    type: string
}
/**
 * форма на странице инвестора
 */
export interface InvestorsFormDeal extends Deal{
    dataIn: InvestorsFormDealDataIn
}

export interface NewInvestorsFormDeal extends NewDeal{
    dataIn: InvestorsFormDealDataIn
}
export interface InvestorsFormDealDataIn{
    type: 'INVESTORS_FORM'       
    formData: InvestorsFormData
}
/**
 * Данный из формы на странице /investors
 * 
 */
export interface InvestorsFormData{
    name: string
    phone: string
    email: string
}
/**
 * клиент
 */

export interface Client extends EsnadHuman{

}
export interface NewClient extends NewEsnadHuman{

}

/**
 * заявки обработка и формирование платежей через финансы
 */



export interface LoanApplication  extends Deal{
    dataIn: LoanApplicationDataIn
    dealStatusTransitions?: LoanApplicationJournal[]
}

export interface NewLoanApplication extends NewDeal{
    dataIn: LoanApplicationDataIn

}

export interface LoanApplicationDataIn{
    type: 'LOAN_APPLICATION'
    firstName: string
    lastName: string
    phone: string
    email: string
    productPrice: string
    term: number[]
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

export interface DealApprovalDecision{

}
export interface FinanceParameters{

}
export interface PaymentScheduleItem{

}
export interface FinanceSchedule{

}
export interface GenerateFinanceScheduleInput{

}
export interface GenerateFinanceScheduleResult{

}

export interface LoanApplicationJournal extends Journal{
    action: 'DEAL_STATUS_TRANSITION'
    details: DealStatusTransition
}
export interface NewLoanApplicationJournal extends NewJournal{
    action: 'DEAL_STATUS_TRANSITION'
    details: DealStatusTransition
}
export interface DealStatusTransition{
    type: 'DEAL_STATUS_TRANSITION'
    dealId: Deal['id']
    from: DealStatus
    to: DealStatus
    performedByUserId: User['id']
    performedAt: string // ISO datetime
    reason?: string
    comment?: string
    source?: 'MANUAL' | 'SYSTEM' | 'AUTO_RULE'
    journalId?: Journal['id']
}