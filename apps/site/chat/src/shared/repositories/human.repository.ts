import { eq, inArray } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import BaseRepository from "./BaseRepositroy";
import { Human } from "../schema/types";
import type { HumanExtended } from "../types/store";
import Humans from "../collections/humans";
import { SiteDb } from "./utils";

export class HumanRepository extends BaseRepository<Human>{
    private constructor(db: D1Database | SiteDb) {
        super(db, schema.humans);
    }

    public static getInstance(db: D1Database | SiteDb): HumanRepository {
        return new HumanRepository(db);
    }
    async findByHaid(haid: string): Promise<any | null> {
        const human = await this.db.select().from(schema.humans).where(eq(schema.humans.haid, haid)).execute()
        const collection = new Humans();
        const parsed = collection.parse<Human>(human as Human[]);
        if (Array.isArray(parsed)) {
            return parsed.length > 0 ? parsed[0] as Human : null;
        }
        return parsed ?? null;
    }
    async getAllManagers(): Promise<HumanExtended[]> {
        const managerRoles = await this.db
            .select()
            .from(schema.roles)
            .where(eq(schema.roles.name, 'manager'))
            .execute();

        if (!managerRoles.length) {
            return [];
        }

        const roleUuids = managerRoles
            .map((role) => role.uuid)
            .filter((uuid): uuid is string => Boolean(uuid));

        if (!roleUuids.length) {
            return [];
        }

        const userRoles = await this.db
            .select()
            .from(schema.userRoles)
            .where(inArray(schema.userRoles.roleUuid, roleUuids))
            .execute();

        const userUuids = Array.from(
            new Set(
                userRoles
                    .map((userRole) => userRole.userUuid)
                    .filter((uuid): uuid is string => Boolean(uuid))
            )
        );

        if (!userUuids.length) {
            return [];
        }

        const users = await this.db
            .select()
            .from(schema.users)
            .where(inArray(schema.users.uuid, userUuids))
            .execute();

        const humanAids = Array.from(
            new Set(
                users
                    .map((user) => user.humanAid)
                    .filter((aid): aid is string => Boolean(aid))
            )
        );

        if (!humanAids.length) {
            return [];
        }

        const humans = await this.db
            .select()
            .from(schema.humans)
            .where(inArray(schema.humans.haid, humanAids))
            .execute();

        const collection = new Humans();
        const parsed = collection.parse<HumanExtended>(humans as unknown as HumanExtended[]);

        return Array.isArray(parsed) ? parsed : [parsed];
    }
}