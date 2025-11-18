import BaseRepository from "./BaseRepositroy";
import { Role } from "../schema/types";
import { schema } from "../schema";

export class RolesRepository extends BaseRepository<Role> {
    constructor(db: D1Database) {
        super(db, schema.roles);
    }
    public static getInstance(db: D1Database): RolesRepository {
        return new RolesRepository(db);
    }
}

