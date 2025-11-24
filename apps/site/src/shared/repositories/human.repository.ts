import { eq } from "drizzle-orm";
import { schema } from "../schema";
import  BaseRepository  from "./BaseRepositroy";
import { Human } from "../schema/types";
import { Client, ClientStatus, EsnadHuman } from "../types/esnad";
import { generateAid } from "../generate-aid";

export class HumanRepository extends BaseRepository<Human>{
    constructor() {
        super(schema.humans);
    }
    
    public static getInstance(): HumanRepository {
        return new HumanRepository();
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

            const _data = {
                email,
                statusName: 'PENDING' as ClientStatus,
                haid: generateAid('h'),
                type: 'CLIENT',
                dataIn: {
                },
                ...data,
            }

            if(! _data.fullName) {
                _data.fullName = email
            }
            human = await this.create(_data) as Client
        } else {
            const updatedFields: Partial<Client> = {}

            if (data) {
                for (const [key, value] of Object.entries(data)) {
                    if (key === 'dataIn') {
                        continue
                    }
                    const currentValue = (human as unknown as Record<string, unknown>)[key]
                    // Only update if current value is empty/null/undefined or equals email (for fullName default)
                    const shouldUpdate = (
                        value !== undefined &&
                        value !== null &&
                        (currentValue === undefined ||
                         currentValue === null ||
                         currentValue === '' ||
                         (key === 'fullName' && currentValue === email))
                    )
                    if (shouldUpdate) {
                        (updatedFields as Record<string, unknown>)[key] = value
                    }
                }

                if (data.dataIn) {
                    const currentDataIn =
                        typeof human.dataIn === 'string'
                            ? (JSON.parse(human.dataIn) as Record<string, unknown>)
                            : (human.dataIn as Record<string, unknown>) || {}

                    const mergedDataIn = {
                        ...currentDataIn,
                        ...data.dataIn,
                    }

                    const dataInChanged = JSON.stringify(currentDataIn) !== JSON.stringify(mergedDataIn)

                    if (dataInChanged) {
                        updatedFields.dataIn = mergedDataIn as Client['dataIn']
                    }
                }
            }

            if (Object.keys(updatedFields).length > 0) {
                human = await this.update(human.uuid, updatedFields) as Client
            }
        }
        return human
    }
}