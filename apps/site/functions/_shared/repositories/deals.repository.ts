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
    LoanApplication,
    JournalLoanApplicationSnapshot,
} from "../types/esnad";
import { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from "../types/shared";
import { buildDbFilters, buildDbOrders, withNotDeleted } from "./utils";
import { eq, sql } from "drizzle-orm";
import { JournalsRepository } from "./journals.repository";

const ADMIN_CONTACT_MESSAGE = ' Пожалуйста, свяжитесь с администратором системы.';
const INTERNAL_DECISION_ERROR_MESSAGE = `Произошла внутренняя ошибка при обработке решения.${ADMIN_CONTACT_MESSAGE}`;

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
    public async createLoanApplicationDealPublic(formData: LoanApplicationDataIn): Promise<{
        createdDeal: LoanApplicationDeal
        journal: JournalLoanApplicationSnapshot
    }> {
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
            throw new Error(`Отсутствуют обязательные поля LoanApplicationDataIn: ${missingFields.join(', ')}.${ADMIN_CONTACT_MESSAGE}`)
        }

        const applicantName = `${sanitizedFormData.firstName} ${sanitizedFormData.lastName}`.trim()


        const newDeal: NewLoanApplication = {
            uuid: crypto.randomUUID(),
            daid: generateAid('d'),
            title: applicantName ? `Loan application - ${applicantName}` : 'Loan application',
            statusName: 'NEW',
            dataIn: sanitizedFormData,
        }

        const createdDeal = await this.create(newDeal) as LoanApplication
        const journalsRepository = JournalsRepository.getInstance(this.d1DB)
        const journal = await journalsRepository.createLoanApplicationSnapshot(createdDeal as LoanApplication,   null, null)
        return {
            createdDeal,
            journal,
        }
    }

    /**
     * обновление заявки на кредит
     * @param uuid - uuid заявки на кредит
     */
    private normalizeLoanApplicationDataIn(rawDataIn: LoanApplication['dataIn']): LoanApplicationDataIn {
        if (typeof rawDataIn === 'string') {
            try {
                return JSON.parse(rawDataIn) as LoanApplicationDataIn;
            } catch {
                throw new Error(`Поле dataIn должно содержать корректный JSON.${ADMIN_CONTACT_MESSAGE}`);
            }
        }

        if (rawDataIn && typeof rawDataIn === 'object') {
            return rawDataIn as LoanApplicationDataIn;
        }

        throw new Error(`Поле dataIn должно быть объектом.${ADMIN_CONTACT_MESSAGE}`);
    }
    private isValidUuid(value: string): boolean {
        const uuid = value.trim();
        const uuidV4Regex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(uuid);
    }

    private async ensureEmployeeExists(uuid: string): Promise<void> {
        const [employee] = await this.db
            .select({ uuid: schema.employees.uuid })
            .from(schema.employees)
            .where(eq(schema.employees.uuid, uuid))
            .limit(1)
            .execute();

        if (!employee) {
            throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
        }
    }

    public async updateLoanApplicationDeal(uuid: string, data: Partial<LoanApplication>): Promise<{
        updatedDeal: LoanApplication
        journal: JournalLoanApplicationSnapshot
    }> {
        if (Object.prototype.hasOwnProperty.call(data, 'dataIn')) {
            const normalizedDataIn = this.normalizeLoanApplicationDataIn(data.dataIn as LoanApplication['dataIn']);

            if (Object.prototype.hasOwnProperty.call(normalizedDataIn, 'decision')) {
                const decision = normalizedDataIn.decision;

                let responsibleEmployeeUuid = decision?.responsibleEmployeeUuid;

                if (typeof responsibleEmployeeUuid !== 'string' || !responsibleEmployeeUuid.trim()) {
                    throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
                }

                responsibleEmployeeUuid = responsibleEmployeeUuid.trim();

                if (!this.isValidUuid(responsibleEmployeeUuid)) {
                    throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
                }

                await this.ensureEmployeeExists(responsibleEmployeeUuid);
            }
        }
        const deal = await this.findByUuid(uuid) as LoanApplication
        if(! deal) {
            throw new Error(`Сделка не найдена.${ADMIN_CONTACT_MESSAGE}`)
        }
        const updatedDeal = await this.update(uuid, data) as LoanApplication
        const journalsRepository = JournalsRepository.getInstance(this.d1DB)
        const journal = await journalsRepository.createLoanApplicationSnapshot(updatedDeal as LoanApplication, deal, null)
        return {
            updatedDeal,
            journal,
        }
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