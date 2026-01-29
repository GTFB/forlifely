import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { getUserXaid } from "@/shared/workshop/get-user-xaid";
import { sql } from "drizzle-orm";
import { UpdateAssetRequest, AssetResponse } from "@/shared/types/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ aaid: string }> }
) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { aaid } = await params;

    if (!aaid) {
      return NextResponse.json(
        { error: "aaid is required" },
        { status: 400 }
      );
    }

    let userXaid: string | null;
    try {
      userXaid = await getUserXaid(request);
    } catch (error: any) {
      console.error("Error getting user xaid:", error?.message || error);
      return NextResponse.json(
        { error: "Authentication error", details: error?.message },
        { status: 401 }
      );
    }
    
    if (!userXaid) {
      console.error("User xaid is null for asset request:", aaid);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, get the asset to check its xaid
    const assetResult = await env.DB.execute(sql`
      SELECT aaid, title, type_name, gin, xaid, status_name, "order", created_at, updated_at
      FROM assets
      WHERE aaid = ${aaid} AND deleted_at IS NULL
    `);

    const asset = assetResult[0] as any;
    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Check if the asset's xaid matches user's xaid OR if it's a project xaid that belongs to the user
    // Assets can be created with project xaid (fullGaid) or user xaid (user.uuid)
    // Check if asset.xaid matches userXaid OR if asset.xaid is a project that belongs to the user
    if (asset.xaid !== userXaid) {
      // Check if asset.xaid is a project (goal) that belongs to the user
      const projectCheck = await env.DB.execute(sql`
        SELECT gaid FROM goals 
        WHERE (gaid = ${asset.xaid} OR full_gaid = ${asset.xaid}) 
          AND xaid = ${userXaid} 
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (!projectCheck || projectCheck.length === 0) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ aaid: string }> }
) {
  try {
    const { aaid } = await params;
    const body = await request.json() as UpdateAssetRequest;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    let userXaid: string | null;
    try {
      userXaid = await getUserXaid(request);
    } catch (error: any) {
      console.error("Error getting user xaid:", error?.message || error);
      return NextResponse.json(
        { error: "Authentication error", details: error?.message },
        { status: 401 }
      );
    }
    
    if (!userXaid) {
      console.error("User xaid is null for asset update request:", aaid);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, gin, xaid } = body;

    // First, check if asset exists and user has access
    const assetCheck = await env.DB.execute(sql`
      SELECT aaid, xaid FROM assets
      WHERE aaid = ${aaid} AND deleted_at IS NULL
    `);

    const asset = assetCheck[0] as any;
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check access
    if (asset.xaid !== userXaid) {
      const projectCheck = await env.DB.execute(sql`
        SELECT gaid FROM goals 
        WHERE (gaid = ${asset.xaid} OR full_gaid = ${asset.xaid}) 
          AND xaid = ${userXaid} 
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (!projectCheck || projectCheck.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If xaid is being changed, verify the new project belongs to the user
    if (xaid !== undefined && xaid !== asset.xaid) {
      const newProjectCheck = await env.DB.execute(sql`
        SELECT gaid FROM goals 
        WHERE (gaid = ${xaid} OR full_gaid = ${xaid}) 
          AND xaid = ${userXaid} 
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (!newProjectCheck || newProjectCheck.length === 0) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 403 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    if (title !== undefined) {
      const escapedTitle = title ? title.replace(/'/g, "''") : "";
      updates.push(`title = '${escapedTitle}'`);
    }
    if (gin !== undefined) {
      const escapedGin = JSON.stringify(gin).replace(/'/g, "''");
      updates.push(`gin = '${escapedGin}'::jsonb`);
    }
    if (xaid !== undefined) {
      const escapedXaid = xaid.replace(/'/g, "''");
      updates.push(`xaid = '${escapedXaid}'`);
    }
    updates.push(`updated_at = NOW()`);

    if (updates.length > 0) {
      await env.DB.execute(
        sql.raw(`UPDATE assets SET ${updates.join(', ')} WHERE aaid = '${aaid.replace(/'/g, "''")}'`)
      );
    }

    // Return updated asset
    const updatedResult = await env.DB.execute(sql`
      SELECT aaid, title, type_name, gin, xaid, status_name, "order", created_at, updated_at
      FROM assets
      WHERE aaid = ${aaid} AND deleted_at IS NULL
    `);

    return NextResponse.json({ asset: updatedResult[0] });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ aaid: string }> }
) {
  try {
    const { aaid } = await params;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    let userXaid: string | null;
    try {
      userXaid = await getUserXaid(request);
    } catch (error: any) {
      console.error("Error getting user xaid:", error?.message || error);
      return NextResponse.json(
        { error: "Authentication error", details: error?.message },
        { status: 401 }
      );
    }
    
    if (!userXaid) {
      console.error("User xaid is null for asset delete request:", aaid);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if asset exists and user has access
    const assetCheck = await env.DB.execute(sql`
      SELECT aaid, xaid FROM assets
      WHERE aaid = ${aaid} AND deleted_at IS NULL
    `);

    const asset = assetCheck[0] as any;
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check access
    if (asset.xaid !== userXaid) {
      const projectCheck = await env.DB.execute(sql`
        SELECT gaid FROM goals 
        WHERE (gaid = ${asset.xaid} OR full_gaid = ${asset.xaid}) 
          AND xaid = ${userXaid} 
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (!projectCheck || projectCheck.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Soft delete: set deleted_at timestamp
    await env.DB.execute(sql`
      UPDATE assets 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE aaid = ${aaid}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}

