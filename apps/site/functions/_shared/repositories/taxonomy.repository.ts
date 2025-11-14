import BaseRepository from "./BaseRepositroy";
import {
    Taxonomy,
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

export class TaxonomyRepository extends BaseRepository<Taxonomy>{
    
    constructor(db: D1Database) {
        super(db, schema.taxonomy)
    }

    /**
     * получение taxonomy с фильтрацией
     */
    public async getTaxonomies({
        filters,
        orders,
        pagination,
    }: {
        filters?: DbFilters
        orders?: DbOrders
        pagination?: DbPagination
    } = {}): Promise<DbPaginatedResult<Taxonomy>> {
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
            docs: docs as Taxonomy[],
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}