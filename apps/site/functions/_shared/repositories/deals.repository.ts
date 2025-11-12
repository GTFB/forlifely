import BaseRepository from "./BaseRepositroy";
import {
    Deal,
    NewDeal,
} from '../schema/types'
import {
    schema
} from '../schema'
import { generateAid } from "../generate-aid";
import { InvestorsFormDeal, InvestorsFormData, NewInvestorsFormDeal } from "../types/esnad";

export class DealsRepository extends BaseRepository<Deal>{
    
    constructor(db: D1Database) {
        super(db, schema.deals)
    }

    protected async beforeCreate(data: Partial<NewDeal>): Promise<void> {
        if(! data.fullDaid){
            data.fullDaid = generateAid('d')
        }
    }
    protected async beforeUpdate(uuid: string, data: Partial<NewDeal>): Promise<void> {
        if(! data.fullDaid){
            data.fullDaid = generateAid('d')
        }
    }

    public async createInvestorsFormDeal(formData: InvestorsFormData): Promise<InvestorsFormDeal> {
        const sanitizedFormData: InvestorsFormData = {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
        }

        const newDeal: NewInvestorsFormDeal = {
            uuid: crypto.randomUUID(),
            daid: generateAid('d'),
            title: sanitizedFormData.name
                ? `Investors form - ${sanitizedFormData.name}`
                : 'Investors form',
            statusName: 'NEW',
            dataIn: {
                type: 'INVESTORS_FORM',
                formData: sanitizedFormData,
            },
        }

        const createdDeal = await this.create(newDeal)

        return createdDeal as InvestorsFormDeal
    }

}