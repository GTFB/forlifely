import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { getUserXaid } from "@/shared/workshop/get-user-xaid";
import { generateAid } from "@/shared/generate-aid";
import { sql } from "drizzle-orm";
import { CreateGoalRequest, GoalsResponse, GoalNode } from "@/shared/types/shared";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";
    
    // Get xaid from authenticated user session
    const xaid = await getUserXaid(request);
    if (!xaid) {
      return NextResponse.json({ goals: [] });
    }

    // Build query to fetch goals hierarchy using drizzle SQL
    const result = type !== "all"
      ? await env.DB.execute(sql`
          SELECT 
            gaid, full_gaid, parent_full_gaid, title, type, status_name, "order", xaid
          FROM goals
          WHERE xaid = ${xaid}
            AND deleted_at IS NULL
            AND type = ${type}
          ORDER BY "order" ASC, created_at ASC
        `)
      : await env.DB.execute(sql`
          SELECT 
            gaid, full_gaid, parent_full_gaid, title, type, status_name, "order", xaid
          FROM goals
          WHERE xaid = ${xaid}
            AND deleted_at IS NULL
          ORDER BY "order" ASC, created_at ASC
        `);

    // Build hierarchy
    const goalsMap = new Map();
    const rootGoals: any[] = [];

    // First pass: create all nodes
    result.forEach((row: any) => {
      const goal = {
        gaid: row.gaid,
        fullGaid: row.full_gaid,
        parentFullGaid: row.parent_full_gaid,
        title: row.title,
        type: row.type,
        statusName: row.status_name,
        order: row.order,
        children: [],
      };
      goalsMap.set(row.full_gaid || row.gaid, goal);
    });

    // Second pass: build hierarchy
    goalsMap.forEach((goal) => {
      if (!goal.parentFullGaid) {
        rootGoals.push(goal);
      } else {
        const parent = goalsMap.get(goal.parentFullGaid);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(goal);
        } else {
          rootGoals.push(goal);
        }
      }
    });

    // Sort children
    const sortGoals = (goals: any[]) => {
      goals.sort((a, b) => (a.order || 0) - (b.order || 0));
      goals.forEach((goal) => {
        if (goal.children) {
          sortGoals(goal.children);
        }
      });
    };
    sortGoals(rootGoals);

    const response: GoalsResponse = { goals: rootGoals as GoalNode[] };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
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

    const body = await request.json() as CreateGoalRequest;
    const { title, type, parent_full_gaid } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "title and type are required" },
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

    // Generate gaid
    const gaid = generateAid("g");
    const uuid = crypto.randomUUID();

    // Calculate full_gaid and parent_full_gaid
    let fullGaid: string;
    let parentFullGaid: string | null = null;

    if (type === "book") {
      // Book is root, no parent
      fullGaid = gaid;
      parentFullGaid = null;
    } else {
      // Child element needs parent
      if (!parent_full_gaid) {
        return NextResponse.json(
          { error: "parent_full_gaid is required for non-book types" },
          { status: 400 }
        );
      }
      parentFullGaid = parent_full_gaid;
      fullGaid = `${parent_full_gaid}/${gaid}`;
    }

    // Get order (count existing siblings)
    let order = 0;
    if (parentFullGaid) {
      const orderResult = await env.DB.execute(sql`
        SELECT COUNT(*) as count 
        FROM goals 
        WHERE parent_full_gaid = ${parentFullGaid} AND deleted_at IS NULL
      `);
      order = Number(orderResult[0]?.count || 0);
    } else {
      const orderResult = await env.DB.execute(sql`
        SELECT COUNT(*) as count 
        FROM goals 
        WHERE parent_full_gaid IS NULL AND type = ${type} AND xaid = ${xaid} AND deleted_at IS NULL
      `);
      order = Number(orderResult[0]?.count || 0);
    }

    // Insert goal using drizzle SQL
    const result = await env.DB.execute(sql`
      INSERT INTO goals (
        uuid, gaid, full_gaid, parent_full_gaid, title, type, status_name, "order", xaid, created_at, updated_at
      )
      VALUES (
        ${uuid}, 
        ${gaid}, 
        ${fullGaid}, 
        ${parentFullGaid}, 
        ${title}, 
        ${type}, 
        'idea', 
        ${order}, 
        ${xaid}, 
        NOW(), 
        NOW()
      )
      RETURNING gaid, full_gaid, parent_full_gaid, title, type, status_name, "order"
    `);

    const goal = result[0] as any;
    if (!goal) {
      return NextResponse.json(
        { error: "Failed to create goal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

