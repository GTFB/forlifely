import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { getUserXaid } from "@/shared/workshop/get-user-xaid";
import { sql } from "drizzle-orm";
import { UpdateGoalRequest } from "@/shared/types/shared";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gaid: string }> }
) {
  try {
    const { gaid } = await params;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const userXaid = await getUserXaid(request);
    if (!userXaid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete: set deleted_at timestamp
    await env.DB.execute(sql`
      UPDATE goals 
      SET deleted_at = NOW() 
      WHERE (gaid = ${gaid} OR full_gaid LIKE ${gaid + '/%'})
        AND xaid = ${userXaid}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gaid: string }> }
) {
  try {
    const { gaid } = await params;
    const body = await request.json() as UpdateGoalRequest;
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const userXaid = await getUserXaid(request);
    if (!userXaid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, parent_full_gaid, status_name } = body;

    // Title is required only if status_name is not provided (for status-only updates)
    if (!title && status_name === undefined) {
      return NextResponse.json(
        { error: "title or status_name is required" },
        { status: 400 }
      );
    }

    // Get current goal to check type - support both gaid and fullGaid
    const currentGoalResult = await env.DB.execute(sql`
      SELECT gaid, type, parent_full_gaid, full_gaid
      FROM goals
      WHERE (gaid = ${gaid} OR full_gaid = ${gaid}) AND xaid = ${userXaid} AND deleted_at IS NULL
    `);

    const currentGoal = currentGoalResult[0] as any;
    if (!currentGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    
    // Use the actual gaid from the database
    const actualGaid = currentGoal.gaid;

    // If parent is being changed, recalculate full_gaid
    if (parent_full_gaid !== undefined && parent_full_gaid !== currentGoal.parent_full_gaid) {
      if (currentGoal.type === "book") {
        return NextResponse.json(
          { error: "Cannot change parent of a book" },
          { status: 400 }
        );
      }

      // Generate new full_gaid based on new parent
      const newFullGaid = parent_full_gaid ? `${parent_full_gaid}/${actualGaid}` : actualGaid;

      // Build update fields dynamically
      const updateFields: string[] = [];
      if (title !== undefined) {
        const escapedTitle = title.replace(/'/g, "''");
        updateFields.push(`title = '${escapedTitle}'`);
      }
      if (status_name !== undefined) {
        const escapedStatus = status_name.replace(/'/g, "''");
        updateFields.push(`status_name = '${escapedStatus}'`);
      }
      updateFields.push(`parent_full_gaid = ${parent_full_gaid ? `'${parent_full_gaid.replace(/'/g, "''")}'` : 'NULL'}`);
      updateFields.push(`full_gaid = '${newFullGaid.replace(/'/g, "''")}'`);
      updateFields.push(`updated_at = NOW()`);

      // Update goal with new parent and full_gaid
      await env.DB.execute(sql.raw(`
        UPDATE goals
        SET ${updateFields.join(', ')}
        WHERE gaid = '${actualGaid.replace(/'/g, "''")}' AND xaid = '${userXaid.replace(/'/g, "''")}'
      `));

      // Update all children's full_gaid recursively
      const updateChildrenFullGaid = async (oldFullGaid: string, newFullGaid: string) => {
        const childrenResult = await env.DB.execute(sql`
          SELECT gaid, full_gaid
          FROM goals
          WHERE parent_full_gaid = ${oldFullGaid} AND xaid = ${userXaid} AND deleted_at IS NULL
        `);

        for (const child of childrenResult as any[]) {
          const childNewFullGaid = `${newFullGaid}/${child.gaid}`;
          await env.DB.execute(sql`
            UPDATE goals
            SET full_gaid = ${childNewFullGaid}, updated_at = NOW()
            WHERE gaid = ${child.gaid} AND xaid = ${userXaid}
          `);
          // Recursively update grandchildren
          await updateChildrenFullGaid(child.full_gaid, childNewFullGaid);
        }
      };

      await updateChildrenFullGaid(currentGoal.full_gaid, newFullGaid);
    } else {
      // Build update fields dynamically
      const updateFields: string[] = [];
      if (title !== undefined) {
        const escapedTitle = title.replace(/'/g, "''");
        updateFields.push(`title = '${escapedTitle}'`);
      }
      if (status_name !== undefined) {
        const escapedStatus = status_name.replace(/'/g, "''");
        updateFields.push(`status_name = '${escapedStatus}'`);
      }
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length > 1) {
        // Just update title and/or status
        await env.DB.execute(sql.raw(`
          UPDATE goals
          SET ${updateFields.join(', ')}
          WHERE gaid = '${actualGaid.replace(/'/g, "''")}' AND xaid = '${userXaid.replace(/'/g, "''")}'
        `));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}
