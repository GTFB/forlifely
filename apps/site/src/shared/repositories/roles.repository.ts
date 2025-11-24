import BaseRepository from "./BaseRepositroy";
import { Role } from "../schema/types";
import { schema } from "../schema";

export class RolesRepository extends BaseRepository<Role> {
    constructor() {
        super(schema.roles);
    }
    public static getInstance(): RolesRepository {
        return new RolesRepository();
    }
}

