import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { getUserXaid } from "@/shared/workshop/get-user-xaid";
import { sql } from "drizzle-orm";
import { CreateTextRequest, TextResponse, TextResponseWrapper } from "@/shared/types/shared";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const goalGaid = searchParams.get("goal_gaid");

    if (!goalGaid) {
      return NextResponse.json({ error: "goal_gaid is required" }, { status: 400 });
    }

    // Find text associated with goal using drizzle SQL
    // Operator ->> returns text, so we can compare directly with text parameter
    // Cast gin to jsonb first in case it's stored as text
    const result = await env.DB.execute(sql`
      SELECT taid, title, content, type, status_name, xaid, gin
      FROM texts 
      WHERE (gin::jsonb)->>'goal_gaid' = ${goalGaid} AND deleted_at IS NULL 
      LIMIT 1
    `);

    const response: TextResponseWrapper = { text: (result[0] ? ((result[0] as unknown) as TextResponse) : null) };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching text by goal:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    return NextResponse.json(
      { error: "Failed to fetch text", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateTextRequest;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { content, title, goal_gaid, gin } = body;

    if (!goal_gaid) {
      return NextResponse.json(
        { error: "goal_gaid is required" },
        { status: 400 }
      );
    }

    // Get user xaid from session
    const xaid = await getUserXaid(request);
    if (!xaid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prepare gin data - merge with goal_gaid to ensure it's always present
    const ginData = gin ? { ...gin, goal_gaid } : { goal_gaid };
    if (!ginData.goal_gaid) {
      ginData.goal_gaid = goal_gaid;
    }
    
    console.log("Saving text with gin:", JSON.stringify(ginData, null, 2));

    // Check if text already exists for this goal
    // Cast gin to jsonb first in case it's stored as text
    const existingResult = await env.DB.execute(sql`
      SELECT taid FROM texts 
      WHERE (gin::jsonb)->>'goal_gaid' = ${goal_gaid} AND deleted_at IS NULL 
      LIMIT 1
    `);

    const existingText = existingResult[0] as any;

    if (existingText) {
      // Update existing text
      console.log("Updating existing text with taid:", existingText.taid);
      console.log("Update data - title:", title, "content length:", content?.length, "gin:", JSON.stringify(ginData));
      
      const ginJson = JSON.stringify(ginData);
      const escapedTitle = (title || "").replace(/'/g, "''");
      const escapedContent = (content || "").replace(/'/g, "''");
      const escapedGinJson = ginJson.replace(/'/g, "''");
      const escapedTaid = existingText.taid.replace(/'/g, "''");
      
      // Build update query dynamically like in [taid]/route.ts
      const updates: string[] = [];
      if (title !== undefined) {
        updates.push(`title = ${title ? `'${escapedTitle}'` : "''"}`);
      }
      if (content !== undefined) {
        updates.push(`content = ${content ? `'${escapedContent}'` : "''"}`);
      }
      if (ginData !== undefined) {
        updates.push(`gin = '${escapedGinJson}'::jsonb`);
      }
      updates.push(`updated_at = NOW()`);
      
      const updateQuery = `UPDATE texts SET ${updates.join(', ')} WHERE taid = '${escapedTaid}' AND deleted_at IS NULL RETURNING taid, title, content, type, status_name, gin`;
      console.log("Full update query:", updateQuery);
      console.log("Update query length:", updateQuery.length);
      console.log("Position 47 char:", updateQuery[46]);
      console.log("Position 40-55:", updateQuery.substring(39, 55));
      
      const updateResult = await env.DB.execute(sql.raw(updateQuery));

      const text = updateResult[0] as any;
      if (!text) {
        console.error("Update returned no rows");
        return NextResponse.json(
          { error: "Failed to update text" },
          { status: 500 }
        );
      }

      console.log("Update successful, returned text:", text);
      return NextResponse.json({ success: true, text });
    } else {
      // Create new text
      const taid = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ginJson = JSON.stringify(ginData);
      const escapedTitle = (title || "").replace(/'/g, "''");
      const escapedContent = (content || "").replace(/'/g, "''");
      const escapedGinJson = ginJson.replace(/'/g, "''");
      const escapedTaid = taid.replace(/'/g, "''");
      const escapedXaid = xaid.replace(/'/g, "''");

      const result = await env.DB.execute(
        sql.raw(`INSERT INTO texts (taid, title, content, type, gin, xaid, created_at, updated_at) VALUES ('${escapedTaid}', '${escapedTitle}', '${escapedContent}', 'scene_draft', '${escapedGinJson}'::jsonb, '${escapedXaid}', NOW(), NOW()) RETURNING taid, title, content, type, status_name`)
      );

      const text = result[0] as any;
      if (!text) {
        return NextResponse.json(
          { error: "Failed to create text" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, text });
    }
  } catch (error: any) {
    console.error("Error saving text:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { error: "Failed to save text", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

