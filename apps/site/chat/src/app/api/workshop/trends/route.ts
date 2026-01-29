import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get trend reports
    const result = await env.DB.execute(sql`
      SELECT taid, title, content, gin, created_at
      FROM texts
      WHERE type = 'trend_report'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({ trends: result || [] });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}

