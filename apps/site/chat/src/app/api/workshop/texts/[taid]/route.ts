import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { sql } from "drizzle-orm";
import { UpdateTextRequest, TextResponse, TextResponseWrapper } from "@/shared/types/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taid: string }> }
) {
  try {
    const { taid } = await params;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const result = await env.DB.execute(sql`
      SELECT taid, title, content, type, status_name, xaid, gin
      FROM texts 
      WHERE taid = ${taid} AND deleted_at IS NULL
    `);

    const text = (result[0] as unknown) as TextResponse;
    if (!text) {
      return NextResponse.json({ error: "Text not found" }, { status: 404 });
    }

    const response: TextResponseWrapper = { text };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching text:", error);
    return NextResponse.json(
      { error: "Failed to fetch text" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taid: string }> }
) {
  try {
    const { taid } = await params;
    const body = await request.json() as UpdateTextRequest;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

        const { content, title, gin } = body;

        // Build update query dynamically
        const updates: string[] = [];
        if (content !== undefined) {
          updates.push(`content = ${content ? `'${content.replace(/'/g, "''")}'` : "''"}`);
        }
        if (title !== undefined) {
          updates.push(`title = ${title ? `'${title.replace(/'/g, "''")}'` : "''"}`);
        }
        if (gin !== undefined) {
          updates.push(`gin = '${JSON.stringify(gin).replace(/'/g, "''")}'::jsonb`);
        }
        updates.push(`updated_at = NOW()`);

        if (updates.length > 0) {
          await env.DB.execute(
            sql.raw(`UPDATE texts SET ${updates.join(', ')} WHERE taid = '${taid.replace(/'/g, "''")}'`)
          );
        }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating text:", error);
    return NextResponse.json(
      { error: "Failed to update text" },
      { status: 500 }
    );
  }
}

