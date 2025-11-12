import {
    Deal,
    Human,
    NewDeal,
    NewHuman,
    
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

export interface Client extends Human{

}
export interface NewClient extends NewHuman{

}
