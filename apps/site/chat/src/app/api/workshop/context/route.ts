import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const goalGaid = searchParams.get("goal_gaid");
    const chapterGaid = searchParams.get("chapter_gaid");

    if (!goalGaid) {
      return NextResponse.json({ error: "goal_gaid is required" }, { status: 400 });
    }

    // Get xaid from goal first
    const goalResult = await env.DB.execute(sql`
      SELECT xaid FROM goals WHERE gaid = ${goalGaid} LIMIT 1
    `);
    
    const goalXaid = goalResult[0]?.xaid;
    if (!goalXaid) {
      return NextResponse.json({
        assets: [],
        relations: [],
      });
    }

    // Get assets (characters, locations, items) related to this scene/chapter
    // This is simplified - actual implementation should use proper relations
    const assetsResult = await env.DB.execute(sql`
      SELECT aaid, title, type_name, gin, xaid
      FROM assets
      WHERE xaid = ${goalXaid}
        AND type_name IN ('character', 'location', 'item')
        AND deleted_at IS NULL
      LIMIT 50
    `);

    // Get relations
    const relationsResult = await env.DB.execute(sql`
      SELECT uuid, source_entity, target_entity, type, gin
      FROM relations
      WHERE xaid = ${goalXaid}
        AND deleted_at IS NULL
    `);

    return NextResponse.json({
      assets: assetsResult || [],
      relations: relationsResult || [],
    });
  } catch (error) {
    console.error("Error fetching context:", error);
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}

