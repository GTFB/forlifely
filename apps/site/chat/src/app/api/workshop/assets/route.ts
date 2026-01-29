import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { generateAid } from "@/shared/generate-aid";
import { sql } from "drizzle-orm";
import { CreateAssetRequest, AssetsResponse, AssetResponse } from "@/shared/types/shared";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const xaid = searchParams.get("xaid");
    const typeName = searchParams.get("type_name");

    if (!xaid) {
      return NextResponse.json(
        { error: "xaid is required" },
        { status: 400 }
      );
    }

    // Fetch assets using drizzle SQL
    const result = typeName
      ? await env.DB.execute(sql`
          SELECT aaid, title, type_name, gin, xaid, status_name, "order"
          FROM assets
          WHERE xaid = ${xaid}
            AND deleted_at IS NULL
            AND type_name = ${typeName}
          ORDER BY "order" ASC, created_at ASC
        `)
      : await env.DB.execute(sql`
          SELECT aaid, title, type_name, gin, xaid, status_name, "order"
          FROM assets
          WHERE xaid = ${xaid}
            AND deleted_at IS NULL
          ORDER BY "order" ASC, created_at ASC
        `);

    const assets = Array.isArray(result) ? result : [];
    const response: AssetsResponse = { assets: assets as unknown as AssetResponse[] };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await request.json() as CreateAssetRequest;
    const { title, type_name, xaid, gin } = body;

    if (!title || !type_name || !xaid) {
      return NextResponse.json(
        { error: "title, type_name, and xaid are required" },
        { status: 400 }
      );
    }

    if (!["character", "location", "item"].includes(type_name)) {
      return NextResponse.json(
        { error: "type_name must be one of: character, location, item" },
        { status: 400 }
      );
    }

    // Generate aaid
    const aaid = generateAid("a");
    const uuid = crypto.randomUUID();

    // Get order (count existing assets of same type in project)
    const orderResult = await env.DB.execute(sql`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE xaid = ${xaid} AND type_name = ${type_name} AND deleted_at IS NULL
    `);
    const order = Number(orderResult[0]?.count || 0);

    // Insert asset using drizzle SQL
    const ginJson = gin ? JSON.stringify(gin) : null;

    const result = await env.DB.execute(sql`
      INSERT INTO assets (
        uuid, aaid, title, type_name, status_name, "order", xaid, gin, created_at, updated_at
      )
      VALUES (
        ${uuid}, 
        ${aaid}, 
        ${title}, 
        ${type_name}, 
        'active', 
        ${order}, 
        ${xaid}, 
        ${ginJson}::jsonb, 
        NOW(), 
        NOW()
      )
      RETURNING aaid, title, type_name, gin, xaid, status_name, "order"
    `);

    const asset = (result[0] as unknown) as AssetResponse;
    if (!asset) {
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      );
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}

