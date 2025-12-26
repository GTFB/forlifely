import BaseRepository from "./BaseRepositroy";
import { EsnadUser } from "../types/esnad";
import { schema } from "../schema";
import { eq, inArray } from "drizzle-orm";

export class UsersRepository extends BaseRepository<EsnadUser> {
    constructor() {
        super(schema.users);
    }

    public static getInstance(): UsersRepository {
        return new UsersRepository();
    }

    public async findByEmail(email: string): Promise<EsnadUser | undefined> {
        const [user] = await this.db.select().from(this.schema).where(eq(this.schema.email, email)).limit(1).execute() as EsnadUser[];
        return user;
    }

    public async findByHumanAid(humanAid: string): Promise<EsnadUser | undefined> {
        const [user] = await this.db.select().from(this.schema).where(eq(this.schema.humanAid, humanAid)).limit(1).execute() as EsnadUser[];
        return user;
    }
    public async hasRoles(humanAid: string, roleNames: string[]): Promise<boolean> {
        const user = await this.findByHumanAid(humanAid);
        if (!user) {
            return false;
        }
        const roles = await this.db.select().from(schema.roles).where(inArray(schema.roles.name, roleNames)).execute();
        const userRoles = await this.db.select().from(schema.userRoles).where(eq(schema.userRoles.userUuid, user.uuid)).execute();
        return userRoles.some(role => roles.some(r => r.uuid === role.roleUuid));
    }
    public async hasRole(humanAid: string, roleName: string): Promise<boolean> {
        return this.hasRoles(humanAid, [roleName]);
    }
}