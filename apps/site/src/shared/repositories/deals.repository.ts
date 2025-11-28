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
    Client,
    LoanApplicationDecision,
} from "../types/esnad";
import { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from "../types/shared";
import { buildDbFilters, buildDbOrders, withNotDeleted } from "./utils";
import { eq, sql, or, like, and, isNull, inArray } from "drizzle-orm";
import { JournalsRepository } from "./journals.repository";
import { HumanRepository } from "./human.repository";
import { UsersRepository } from "./users.repository";
import { UserRolesRepository } from "./user-roles.repository";
import { preparePassword } from "../password";
import { FinancesRepository } from "./finances.repository";
import {
    PaymentScheduleInput,
    PaymentLimitsConfig,
    IsoDate,
} from "../types/esnad-finance";

const ADMIN_CONTACT_MESSAGE = ' Пожалуйста, свяжитесь с администратором системы.';
const INTERNAL_DECISION_ERROR_MESSAGE = `Произошла внутренняя ошибка при обработке решения.${ADMIN_CONTACT_MESSAGE}`;

export class DealsRepository extends BaseRepository<Deal>{
    
    constructor() {
        super(schema.deals)
    }

    public static getInstance(): DealsRepository {
        return new DealsRepository();
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
        client: Client
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
            statusName: 'SCORING',
            dataIn: sanitizedFormData,
        }

        const humanRepository = HumanRepository.getInstance()
        const client = await humanRepository.generateClientByEmail(sanitizedFormData.email, {
            fullName: applicantName,
            dataIn: {
                phone: sanitizedFormData.phone,
            }
        }) as Client
        newDeal.clientAid = client.haid
        const createdDeal = await this.create(newDeal) as LoanApplication
        const journalsRepository = JournalsRepository.getInstance()
        const journal = await journalsRepository.createLoanApplicationSnapshot(createdDeal as LoanApplication,   null, null)
        
        // Ensure user with 'client' role exists
        await this.ensureClientUser(sanitizedFormData.email, client)
        
        return {
            createdDeal,
            journal,
            client,
        }
    }

    /**
     * Ensure user with 'client' role exists for the given email and client
     * Creates a new user if one doesn't exist, or assigns 'client' role if user exists
     */
    private async ensureClientUser(email: string, client: Client): Promise<void> {
        const usersRepository = UsersRepository.getInstance()
        const userRolesRepository = UserRolesRepository.getInstance()

        // Check if user already exists
        const existingUser = await usersRepository.findByEmail(email)

        if (!existingUser) {
            // Generate random password for the new user
            const randomPassword = this.generateRandomPassword()
            const { hashedPassword, salt } = await preparePassword(randomPassword)

            // Create user
            await usersRepository.create({
                humanAid: client.haid,
                email: email,
                passwordHash: hashedPassword,
                salt,
                isActive: true,
            })

            // Assign 'client' role to the user
            const newUser = await usersRepository.findByEmail(email)
            if (newUser) {
                await userRolesRepository.assignRolesToUserByNames(newUser.uuid, ['client'])
            }
        } else {
            // If user exists, ensure they have 'client' role
            await userRolesRepository.assignRolesToUserByNames(existingUser.uuid, ['client'])
        }
    }

    /**
     * Generate a random password for new users
     */
    private generateRandomPassword(): string {
        const length = 16
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        const values = crypto.getRandomValues(new Uint8Array(length))
        return Array.from(values, (x) => charset[x % charset.length]).join('')
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
        try {
            // Check if user exists
            const [user] = await this.db
                .select({ uuid: schema.users.uuid })
                .from(schema.users)
                .where(eq(schema.users.uuid, uuid))
                .limit(1)
                .execute();

            if (!user) {
                throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
            }

            // Get user roles
            const userRoleAssociations = await this.db
                .select()
                .from(schema.userRoles)
                .where(eq(schema.userRoles.userUuid, uuid))
                .execute();

            if (!userRoleAssociations.length) {
                throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
            }

            // Get role UUIDs
            const roleUuids = userRoleAssociations.map((ur) => ur.roleUuid);

            // Fetch roles to check names
            const roles = await this.db
                .select()
                .from(schema.roles)
                .where(
                    and(
                        sql`${schema.roles.deletedAt} IS NULL`,
                        inArray(schema.roles.uuid, roleUuids)
                    )
                )
                .execute();

            // Check if user has admin or super-admin role
            const hasAdminRole = roles.some(
                (role) => role.name === 'admin' || role.name === 'super-admin'
            );

            if (!hasAdminRole) {
                throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
            }
        } catch (error) {
            // If table doesn't exist or query fails, throw the expected error
            if (error instanceof Error && error.message === INTERNAL_DECISION_ERROR_MESSAGE) {
                throw error;
            }
            // For any other database errors (table not found, etc.), throw the expected error
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
                // Validate managerUuid from dataIn (not from decision)
                let managerUuid = normalizedDataIn.managerUuid;

                if (typeof managerUuid !== 'string' || !managerUuid.trim()) {
                    throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
                }

                managerUuid = managerUuid.trim();

                if (!this.isValidUuid(managerUuid)) {
                    throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
                }

                await this.ensureEmployeeExists(managerUuid);
            }
        }
        const deal = await this.findByUuid(uuid) as LoanApplication
        if(! deal) {
            throw new Error(`Сделка не найдена.${ADMIN_CONTACT_MESSAGE}`)
        }
        const updatedDeal = await this.update(uuid, data) as LoanApplication
        const journalsRepository = JournalsRepository.getInstance()
        const journal = await journalsRepository.createLoanApplicationSnapshot(updatedDeal as LoanApplication, deal, null)
        return {
            updatedDeal,
            journal,
        }
    }

    /**
     * Одобрение заявки на кредит
     * Обновляет статус на APPROVED, сохраняет комментарий СБ и менеджера,
     * и автоматически генерирует график платежей (Finance)
     */
    public async approveLoanApplication(
        uuid: string,
        securityServiceComment: string,
        managerUuid: string
    ): Promise<{
        updatedDeal: LoanApplication
        journal: JournalLoanApplicationSnapshot
    }> {
        // Validate managerUuid
        if (typeof managerUuid !== 'string' || !managerUuid.trim()) {
            throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
        }

        const trimmedManagerUuid = managerUuid.trim();

        if (!this.isValidUuid(trimmedManagerUuid)) {
            throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
        }

        await this.ensureEmployeeExists(trimmedManagerUuid);

        // Get existing deal
        const deal = await this.findByUuid(uuid) as LoanApplication | undefined;
        if (!deal) {
            throw new Error(`Сделка не найдена.${ADMIN_CONTACT_MESSAGE}`);
        }

        // Validate that deal is a loan application
        const currentDataIn = this.normalizeLoanApplicationDataIn(deal.dataIn);
        if (currentDataIn.type !== 'LOAN_APPLICATION') {
            throw new Error(`Сделка не является заявкой на кредит.${ADMIN_CONTACT_MESSAGE}`);
        }

        // Prepare updated data
        const decision: LoanApplicationDecision = {
            securityServiceComment: securityServiceComment.trim(),
        };

        const updatedData: Partial<LoanApplication> = {
            statusName: 'APPROVED',
            dataIn: {
                ...currentDataIn,
                managerUuid: trimmedManagerUuid,
                decision,
            },
        };

        // Update deal
        const updatedDeal = await this.update(uuid, updatedData) as LoanApplication;

        // Create journal entry
        const journalsRepository = JournalsRepository.getInstance();
        const journal = await journalsRepository.createLoanApplicationSnapshot(
            updatedDeal as LoanApplication,
            deal,
            null
        );

        // Generate payment schedule
        const financesRepository = new FinancesRepository();
        const productPrice = Number(currentDataIn.productPrice) || 0;
        const termMonths = currentDataIn.term && currentDataIn.term.length > 0
            ? currentDataIn.term[0]
            : 12;

        // Calculate first payment date (30 days from now)
        const firstPaymentDate = new Date();
        firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

        // Default payment limits configuration
        const defaultLimits: PaymentLimitsConfig = {
            minAmount: 0,
            maxAmount: productPrice,
            defaultTermMonths: termMonths,
            gracePeriodDays: 3,
            penaltyDailyRatePercent: 0.1,
            reminderEnabled: true,
            reminderDaysBefore: [7, 3, 1],
            reminderChannels: ['EMAIL', 'SMS'],
        };

        const scheduleInput: PaymentScheduleInput = {
            dealAid: updatedDeal.daid,
            totalAmount: productPrice,
            upfrontAmount: 0,
            termMonths: termMonths,
            firstPaymentDate: firstPaymentDate.toISOString().split('T')[0] as IsoDate,
            timezone: 'Europe/Moscow',
            paymentMethod: 'CARD',
            limits: defaultLimits,
            generatedBy: 'SYSTEM',
        };

        await financesRepository.generateScheduleForDeal(uuid, scheduleInput);

        return {
            updatedDeal,
            journal,
        };
    }

    /**
     * Отказ в заявке на кредит
     * Обновляет статус на CANCELLED и сохраняет комментарий СБ и менеджера
     */
    public async rejectLoanApplication(
        uuid: string,
        securityServiceComment: string,
        managerUuid: string
    ): Promise<{
        updatedDeal: LoanApplication
        journal: JournalLoanApplicationSnapshot
    }> {
        // Validate managerUuid
        if (typeof managerUuid !== 'string' || !managerUuid.trim()) {
            throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
        }

        const trimmedManagerUuid = managerUuid.trim();

        if (!this.isValidUuid(trimmedManagerUuid)) {
            throw new Error(INTERNAL_DECISION_ERROR_MESSAGE);
        }

        await this.ensureEmployeeExists(trimmedManagerUuid);

        // Get existing deal
        const deal = await this.findByUuid(uuid) as LoanApplication | undefined;
        if (!deal) {
            throw new Error(`Сделка не найдена.${ADMIN_CONTACT_MESSAGE}`);
        }

        // Validate that deal is a loan application
        const currentDataIn = this.normalizeLoanApplicationDataIn(deal.dataIn);
        if (currentDataIn.type !== 'LOAN_APPLICATION') {
            throw new Error(`Сделка не является заявкой на кредит.${ADMIN_CONTACT_MESSAGE}`);
        }

        // Prepare updated data
        const decision: LoanApplicationDecision = {
            securityServiceComment: securityServiceComment.trim(),
        };

        const updatedData: Partial<LoanApplication> = {
            statusName: 'CANCELLED',
            dataIn: {
                ...currentDataIn,
                managerUuid: trimmedManagerUuid,
                decision,
            },
        };

        // Update deal
        const updatedDeal = await this.update(uuid, updatedData) as LoanApplication;

        // Create journal entry
        const journalsRepository = JournalsRepository.getInstance();
        const journal = await journalsRepository.createLoanApplicationSnapshot(
            updatedDeal as LoanApplication,
            deal,
            null
        );

        return {
            updatedDeal,
            journal,
        };
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

    /**
     * получение deals с полнотекстовым поиском по deals и связанным humans
     */
    public async getDealsWithSearch({
        searchQuery,
        filters,
        orders,
        pagination,
    }: {
        searchQuery: string
        filters?: DbFilters
        orders?: DbOrders
        pagination?: DbPagination
    }): Promise<DbPaginatedResult<Deal>> {
        const searchPattern = `%${searchQuery}%`
        
        // Build base filters condition
        const filtersCondition = buildDbFilters(this.schema, filters);
        const baseWhereCondition = withNotDeleted(this.schema.deletedAt, filtersCondition);

        // Build search conditions using ILIKE for case-insensitive search in PostgreSQL
        // drizzle-orm automatically escapes variables in sql template as parameters
        const searchConditions = or(
            sql`${this.schema.daid}::text ILIKE ${searchPattern}`,
            sql`${this.schema.title}::text ILIKE ${searchPattern}`,
            sql`${this.schema.dataIn}::text ILIKE ${searchPattern}`,
            sql`EXISTS (
                SELECT 1 FROM ${schema.humans} 
                WHERE ${schema.humans.haid} = ${this.schema.clientAid}
                AND ${schema.humans.deletedAt} IS NULL
                AND (
                    ${schema.humans.fullName}::text ILIKE ${searchPattern}
                    OR ${schema.humans.email}::text ILIKE ${searchPattern}
                )
            )`
        )

        // Combine base conditions with search
        const whereCondition = baseWhereCondition 
            ? and(baseWhereCondition, searchConditions)
            : searchConditions

        // Get total count
        const totalRows = await this.db
            .select({ count: sql<number>`count(DISTINCT ${this.schema.id})`.mapWith(Number) })
            .from(this.schema)
            .where(whereCondition)
            .execute();

        const total = totalRows[0]?.count ?? 0;
        const limit = Math.max(1, Math.min(pagination?.limit ?? 20, 100));
        const page = Math.max(1, pagination?.page ?? 1);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const offset = (page - 1) * limit;

        // Get deals with search
        const docs = await this.db
            .selectDistinct()
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