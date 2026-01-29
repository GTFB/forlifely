import { eq } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import type { Deal } from "../schema/types";
import { createDb, parseJson, stringifyJson, notDeleted, withNotDeleted, type SiteDb } from "./utils";

type DealTotals = {
  price: number;
  purchasePrice: number;
  minCampaignPrice: number;
  maxCampaignPrice: number;
  totalUnits: number;
  totalBoxes: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export class DealsRepository {
  private static instance: DealsRepository | null = null;
  private readonly db: SiteDb;

  private constructor(db: D1Database | SiteDb) {
    this.db = createDb(db);
  }

  public static getInstance(db: D1Database | SiteDb): DealsRepository {
    if (!DealsRepository.instance) {
      DealsRepository.instance = new DealsRepository(db);
    }
    return DealsRepository.instance;
  }

  async findByFullDaid(fullDaid: string): Promise<Deal | undefined> {
    const [deal] = await this.db
      .select()
      .from(schema.deals)
      .where(withNotDeleted(
        schema.deals.deletedAt,
        eq(schema.deals.fullDaid, fullDaid)
      ))
      .limit(1);

    return deal;
  }

  async findByDaid(daid: string): Promise<Deal | undefined> {
    const [deal] = await this.db
      .select()
      .from(schema.deals)
      .where(withNotDeleted(
        schema.deals.deletedAt,
        eq(schema.deals.daid, daid)
      ))
      .limit(1);

    return deal;
  }

  async softDelete(daid: string): Promise<boolean> {
    const existing = await this.findByDaid(daid);
    if (!existing) {
      return false;
    }

    await this.db
      .update(schema.deals)
      .set({
        deletedAt: new Date().toISOString(),
      })
      .where(eq(schema.deals.id, existing.id));

    return true;
  }

  async confirm(params: { fullDaid?: string; daid?: string }): Promise<Deal | null> {
    const { fullDaid, daid } = params;

    const deal = fullDaid
      ? await this.findByFullDaid(fullDaid)
      : daid
      ? await this.findByDaid(daid)
      : undefined;

    if (!deal) {
      return null;
    }

    const nextStatus = 'IN_PROGRESS';
    const updatedAt = new Date().toISOString();

    await this.db
      .update(schema.deals)
      .set({ statusName: nextStatus, updatedAt })
      .where(eq(schema.deals.id, deal.id));

    return {
      ...deal,
      statusName: nextStatus,
      updatedAt,
    };
  }

  async recalculateFinancials(fullDaid: string): Promise<Deal | null> {
    const deal = await this.findByFullDaid(fullDaid);
    if (!deal) {
      return null;
    }

    if ((deal.statusName || "").toUpperCase() !== "ACTIVE") {
      return deal;
    }

    const products = await this.db
      .select()
      .from(schema.dealProducts)
      .where(
        eq(schema.dealProducts.fullDaid, fullDaid)
      );

    const totals: DealTotals = {
      price: 0,
      purchasePrice: 0,
      minCampaignPrice: 0,
      maxCampaignPrice: 0,
      totalUnits: 0,
      totalBoxes: 0,
    };

    const boxes = new Set<string>();

    for (const product of products) {
      const quantity = toNumber(product.quantity);
      if (!quantity) {
        continue;
      }

      const productData = parseJson<Record<string, unknown>>(product.dataIn, {});

      totals.price += this.collectMetric(productData, quantity, [
        "selling_price_fact",
        "selling_price_plan",
        "price",
      ]);
      totals.purchasePrice += this.collectMetric(productData, quantity, [
        "purchase_price_fact",
        "purchase_price_plan",
        "purchase_price",
      ]);
      totals.minCampaignPrice += this.collectMetric(productData, quantity, [
        "min_campaign_price",
        "minCampaignPrice",
      ]);
      totals.maxCampaignPrice += this.collectMetric(productData, quantity, [
        "max_campaign_price",
        "maxCampaignPrice",
      ]);

      const unitsPerPackage = this.collectMetric(productData, 1, [
        "units_per_pack",
        "unitsPerPack",
        "quantity_per_box",
        "units",
      ]);

      totals.totalUnits += quantity * (unitsPerPackage || 1);

      const boxUuid = (productData?.box_uuid || productData?.boxUuid || productData?.complect_uuid) as
        | string
        | undefined;
      if (boxUuid) {
        boxes.add(boxUuid);
      }
    }

    totals.totalBoxes = boxes.size;

    const data = parseJson<Record<string, unknown>>(deal.dataIn, {});
    data.price = totals.price;
    data.sale_price = totals.price;
    data.purchase_price = totals.purchasePrice;
    data.total_purchase = totals.purchasePrice;
    data.total_sale = totals.price;
    data.min_campaign_price = totals.minCampaignPrice;
    data.max_campaign_price = totals.maxCampaignPrice;
    data.total_units = totals.totalUnits;
    data.total_boxes = totals.totalBoxes;

    // For jsonb pass object directly
    const serialized = data; 

    await this.db
      .update(schema.deals)
      .set({ dataIn: serialized })
      .where(eq(schema.deals.id, deal.id));

    return {
      ...deal,
      dataIn: serialized ?? deal.dataIn,
    };
  }

  private collectMetric(
    data: Record<string, unknown>,
    multiplier: number,
    keys: string[]
  ): number {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        return toNumber(data[key]) * multiplier;
      }
    }

    return 0;
  }
}
