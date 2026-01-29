import type { D1Database } from "@cloudflare/workers-types";
import { eq, } from "drizzle-orm";
import { createDb, SiteDb, buildDbFilters, buildDbOrders } from "./utils";
import BaseCollection from "../collections/BaseCollection";
import type { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from "../types/shared";

export default class BaseRepository<T> {
    protected db: SiteDb;
    protected d1DB: D1Database | undefined;
    protected table: any;
    protected schema: any;

    // Allow accepting SiteDb directly or D1Database (for legacy compatibility)
    constructor(db: D1Database | SiteDb, table: any) {
        this.db = createDb(db);
        // If it's a D1Database, keep it referenced if needed, otherwise undefined
        this.d1DB = (db && 'prepare' in db) ? db as D1Database : undefined;
        this.table = table;
        this.schema = table; // Fix: this.schema was undefined or unused correctly? using table as schema for queries
    }

    protected async beforeCreate(data: Partial<T>): Promise<void> {}
    protected async afterCreate(entity: T): Promise<void> {}
    protected async beforeUpdate(uuid: string, data: Partial<T>): Promise<void> {}
    protected async afterUpdate(entity: T): Promise<void> {}
    protected async beforeDelete(uuid: string, force: boolean): Promise<void> {}
    protected async afterDelete(uuid: string, force: boolean): Promise<void> {}
    
    public static getInstance(db: D1Database | SiteDb, schema: any): BaseRepository<any> {
        return new BaseRepository(db, schema);
    }
    async findByUuid(uuid: string): Promise<T> {
        const [row] = await this.db.select().from(this.table).where(eq(this.table.uuid, uuid)).execute();
        return row as unknown as T;
    }
    async findAll(): Promise<T[]> {
        const rows = await this.db.select().from(this.table).execute();
        return rows as unknown as T[];
    }
    async create(data: any): Promise<T> {
        if (!data.uuid) {
            data.uuid = crypto.randomUUID();
        }

        // Use Date objects for Postgres
        if(this.schema.createdAt || this.table.createdAt){
             // Checks if field exists in schema (column definition)
            data.createdAt = new Date();
        }
        if(this.schema.updatedAt || this.table.updatedAt){
            data.updatedAt = new Date();
        }
        await this.beforeCreate(data as Partial<T>);
        await this.db.insert(this.table).values(data).execute();
        const entity = await this.findByUuid(data.uuid);
        await this.afterCreate(entity);
        return entity;
    }
    async update(uuid: string, data: any, collection: BaseCollection | null = null ): Promise<T> {

        if (!collection) {
            collection = new BaseCollection();
        }


        if(this.schema.updatedAt || this.table.updatedAt){
            data.updatedAt = new Date();
        }
        await this.beforeUpdate(uuid, data as Partial<T>);
        await this.db.update(this.table).set(data).where(eq(this.table.uuid, uuid)).execute();
        const entity = await this.findByUuid(uuid);
        await this.afterUpdate(entity);
        return entity;
    }
    async deleteByUuid(uuid: string, force: boolean= false): Promise<any> {
        await this.beforeDelete(uuid, force);
        const result = force ? await this._forceDeleteByUuid(uuid) : await this._softDeleteByUuid(uuid);
        await this.afterDelete(uuid, force);
        return result;
    }
    protected async _forceDeleteByUuid(uuid: string){
        return await this.db.delete(this.table).where(eq(this.table.uuid, uuid)).execute();
    }
    protected async _softDeleteByUuid(uuid: string){

        if(this.schema.deletedAt || this.table.deletedAt){
            return await this.db.update(this.table).set({ deletedAt: new Date() }).where(eq(this.table.uuid, uuid)).execute();
        }

       return await this.db.delete(this.table).where(eq(this.table.uuid, uuid)).execute();
    }
    
    public getSelectQuery() {
        return this.db.select().from(this.table)
    }
    public async getFiltered(filters: DbFilters, orders: DbOrders, pagination: DbPagination): Promise<DbPaginatedResult<T>> {
        const query = this.getSelectQuery()
        const where = buildDbFilters(this.table, filters)
        const order = buildDbOrders(this.table, orders)

        const limit = Math.max(1, Math.min(pagination.limit ?? 10, 10000))
        const page = Math.max(1, pagination.page ?? 1)
        const offset = (page - 1) * limit

        // Get total count
        const countQuery = this.getSelectQuery()
        const totalRows = where
            ? await countQuery.where(where).execute()
            : await countQuery.execute()
        const total = totalRows.length

        const resultQuery = where
            ? query.where(where).orderBy(...order).limit(limit).offset(offset)
            : query.orderBy(...order).limit(limit).offset(offset)
        const result = await resultQuery.execute() as T[]

        return {
            docs: result,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        }
    }
}
