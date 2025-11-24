import BaseRepository from "./BaseRepositroy";
import { EsnadUser } from "../types/esnad";
import { schema } from "../schema";
import { eq } from "drizzle-orm";

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
}