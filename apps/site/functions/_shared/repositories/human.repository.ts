import { eq } from "drizzle-orm";
import { schema } from "../schema";
import  BaseRepository  from "./BaseRepositroy";
import { Human } from "../schema/types";
import { Client, ClientStatus, EsnadHuman } from "../types/esnad";
import { generateAid } from "../generate-aid";

export class HumanRepository extends BaseRepository<Human>{
    constructor(db: D1Database) {
        super(db, schema.humans);
    }
    
    public static getInstance(db: D1Database): HumanRepository {
        return new HumanRepository(db);
    }
    async findByHaid(haid: string): Promise<any | null> {
        const human = await this.db.select().from(schema.humans).where(eq(schema.humans.haid, haid)).execute()
        return human[0]
    }
    protected async beforeCreate(data: Partial<EsnadHuman>): Promise<void> {
        if (!data.statusName) {
            data.statusName = 'PENDING'
        }
        if(! data.haid) {
            data.haid = generateAid('h')
        }
    }
    async generateClientByEmail(email: string, data: Partial<Client>): Promise<Client> {
        let [human] = await this.db.select().from(schema.humans).where(eq(schema.humans.email, email)).execute() as Client[]
        if(! human) {
            human = await this.create({
                email: email,
                statusName: 'PENDING' as ClientStatus,
                haid: generateAid('h'),
                type: 'CLIENT',
                dataIn: {
                },
                ...data,
            }) as Client
        }
        return human
    }
}