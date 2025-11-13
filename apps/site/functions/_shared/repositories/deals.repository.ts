import BaseRepository from "./BaseRepositroy";
import {
    Deal,
    NewDeal,
} from '../schema/types'
import {
    schema
} from '../schema'
import { generateAid } from "../generate-aid";
import {
    InvestorsFormDeal,
    InvestorsFormData,
    LoanApplicationDeal,
    LoanApplicationDataIn,
    NewInvestorsFormDeal,
    NewLoanApplication,
} from "../types/esnad";
import { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from "../types/shared";
import { buildDbFilters, buildDbOrders, withNotDeleted } from "./utils";
import { sql } from "drizzle-orm";

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
    /**
     * прием заявки с формы на сайте
     */
    public async createLoanApplicationDealPublic(formData: LoanApplicationDataIn): Promise<LoanApplicationDeal> {
        const sanitizedFormData: LoanApplicationDataIn = {
            type: 'LOAN_APPLICATION',
            firstName: formData.firstName?.trim() ?? '',
            lastName: formData.lastName?.trim() ?? '',
            phone: formData.phone?.trim() ?? '',
            email: formData.email?.trim().toLowerCase() ?? '',
            productPrice: formData.productPrice?.trim() ?? '',
            term: Array.isArray(formData.term)
                ? formData.term
                    .map((value) => Number(value))
                    .filter((value) => Number.isFinite(value))
                : [],
        }

        const missingFields: string[] = []

        if (!sanitizedFormData.firstName) missingFields.push('firstName')
        if (!sanitizedFormData.lastName) missingFields.push('lastName')
        if (!sanitizedFormData.phone) missingFields.push('phone')
        if (!sanitizedFormData.email) missingFields.push('email')
        if (!sanitizedFormData.productPrice) missingFields.push('productPrice')
        if (!sanitizedFormData.term.length) missingFields.push('term')

        if (missingFields.length) {
            throw new Error(`LoanApplicationDataIn is missing required fields: ${missingFields.join(', ')}`)
        }

        const applicantName = `${sanitizedFormData.firstName} ${sanitizedFormData.lastName}`.trim()


        const newDeal: NewLoanApplication = {
            uuid: crypto.randomUUID(),
            daid: generateAid('d'),
            title: applicantName ? `Loan application - ${applicantName}` : 'Loan application',
            statusName: 'NEW',
            dataIn: sanitizedFormData,
        }

        const createdDeal = await this.create(newDeal)

        return createdDeal as LoanApplicationDeal
    }
    /**
     * получение deal с фильтрацией
     */
    public async getDeals({
        filters,
        orders,
        pagination,
    }: {
        filters?: DbFilters
        orders?: DbOrders
        pagination?: DbPagination
    } = {}): Promise<DbPaginatedResult<Deal>> {
        const filtersCondition = buildDbFilters(this.schema, filters);
        const whereCondition = withNotDeleted(this.schema.deletedAt, filtersCondition);

        const totalRows = await this.db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(this.schema)
            .where(whereCondition)
            .execute();

        const total = totalRows[0]?.count ?? 0;
        const limit = Math.max(1, Math.min(pagination?.limit ?? 20, 100));
        const page = Math.max(1, pagination?.page ?? 1);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const offset = (page - 1) * limit;


        const docs = await this.db
            .select()
            .from(this.schema)
            .where(whereCondition)
            .orderBy(...buildDbOrders(this.schema, orders))
            .limit(limit)
            .offset(offset)
            .execute();

        return {
            docs: docs as Deal[],
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}