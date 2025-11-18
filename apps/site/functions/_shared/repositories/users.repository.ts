import BaseRepository from "./BaseRepositroy";
import { EsnadUser } from "../types/esnad";
import { schema } from "../schema";

export class UsersRepository extends BaseRepository<EsnadUser> {
    constructor(db: D1Database) {
        super(db, schema.users);
    }
    public static getInstance(db: D1Database): UsersRepository {
        return new UsersRepository(db);
    }
    
}