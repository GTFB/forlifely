import { eq } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import type { Setting } from "../schema/types";
import { createDb, type SiteDb } from "./utils";

export class SettingsRepository {
  private static instance: SettingsRepository | null = null;
  private readonly db: SiteDb;

  private constructor(db: D1Database | SiteDb) {
    this.db = createDb(db);
  }

  public static getInstance(db: D1Database | SiteDb): SettingsRepository {
    if (!SettingsRepository.instance) {
      SettingsRepository.instance = new SettingsRepository(db);
    }
    return SettingsRepository.instance;
  }

  async findByAttribute(attribute: string): Promise<Setting | null> {
    const result = await this.db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.attribute, attribute))
      .limit(1)
      .execute();
    
    return result[0] || null;
  }

  async getValue(attribute: string): Promise<string | null> {
    const setting = await this.findByAttribute(attribute);
    return setting?.value || null;
  }

  async getShippingSettings(): Promise<{
    freeShippingThreshold: number;
    shippingCost: number;
  }> {
    const freeThreshold = await this.getValue('shipping_free_threshold');
    const shippingCost = await this.getValue('shipping_cost');
    
    return {
      freeShippingThreshold: freeThreshold ? parseFloat(freeThreshold) : 1000,
      shippingCost: shippingCost ? parseFloat(shippingCost) : 200,
    };
  }

  calculateShippingCost(orderTotal: number): number {
    // This is a helper method that will be used after fetching settings
    // The actual calculation will be done in the service layer
    return 0;
  }
}

