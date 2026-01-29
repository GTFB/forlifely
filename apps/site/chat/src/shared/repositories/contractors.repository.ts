import { eq } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import type { Contractor } from "../schema/types";
import type { ContractorExtended } from "../types/store";
import { createDb, parseJson, notDeleted, withNotDeleted, type SiteDb } from "./utils";
import { WalletsRepository } from "./wallets.repository";
import BaseRepository from "./BaseRepositroy";

export class ContractorsRepository extends BaseRepository<Contractor> {
  private static instance: ContractorsRepository | null = null;

  private constructor(db: D1Database | SiteDb) {
    super(db, schema.contractors);
  }

  public static getInstance(db: D1Database | SiteDb): ContractorsRepository {
    if (!ContractorsRepository.instance) {
      ContractorsRepository.instance = new ContractorsRepository(db);
    }
    return ContractorsRepository.instance;
  }

  async findByCaid(caid: string): Promise<Contractor | undefined> {
    const [contractor] = await this.db
      .select()
      .from(schema.contractors)
      .where(withNotDeleted(
        schema.contractors.deletedAt,
        eq(schema.contractors.caid, caid)
      ))
      .limit(1);

    return contractor;
  }

  async getActiveContractors(limit = 100): Promise<Contractor[]> {


    const contractors = await this.db
      .select()
      .from(schema.contractors)
      .where(withNotDeleted(
        schema.contractors.deletedAt,
        eq(schema.contractors.statusName, "ACTIVE")
      ))
      .limit(limit)
      .execute() as ContractorExtended[];

    const wallets = await WalletsRepository.getInstance(this.db).generateWalletsForContractors(contractors);
    
    return contractors
  }

  async getAllContractors(limit = 100): Promise<Contractor[]> {
    return this.db
      .select()
      .from(schema.contractors)
      .where(notDeleted(schema.contractors.deletedAt))
      .limit(limit)
      .execute();
  }
}
