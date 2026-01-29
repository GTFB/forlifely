import { NextRequest, NextResponse } from "next/server";
import { buildRequestEnv } from "@/shared/env";
import { getUserXaid } from "@/shared/workshop/get-user-xaid";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const env = buildRequestEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentGaid = searchParams.get("parent_gaid");

    if (!parentGaid) {
      return NextResponse.json({ error: "parent_gaid is required" }, { status: 400 });
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
      console.error("User xaid is null for stats request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log(`Asset stats request: parentGaid=${parentGaid}, userXaid=${userXaid}`);

    // First, find the parent goal to get its fullGaid and determine the project
    const parentGoalResult = await env.DB.execute(sql`
      SELECT gaid, full_gaid, xaid, type
      FROM goals
      WHERE (gaid = ${parentGaid} OR full_gaid = ${parentGaid})
        AND xaid = ${userXaid}
        AND deleted_at IS NULL
      LIMIT 1
    `);
    
    if (parentGoalResult.length === 0) {
      console.log(`Parent goal not found for: ${parentGaid}`);
      return NextResponse.json({
        characters: [],
        locations: [],
        items: [],
      });
    }
    
    const parentGoal = parentGoalResult[0] as any;
    const parentFullGaid = parentGoal.full_gaid || parentGoal.gaid;
    
    // Find the root project (book) for this parent
    // fullGaid format: "book-gaid/volume-gaid/chapter-gaid/scene-gaid"
    // If parent is a book, use its fullGaid (or gaid if fullGaid not available)
    // Otherwise, extract the first segment which is the book gaid
    let projectGaid = parentFullGaid;
    if (parentGoal.type !== 'book') {
      const parts = parentFullGaid.split('/');
      const bookGaidCandidate = parts[0] || parentFullGaid;
      
      // Verify that this is actually a book and get its fullGaid
      const bookCheck = await env.DB.execute(sql`
        SELECT gaid, full_gaid, type
        FROM goals
        WHERE (gaid = ${bookGaidCandidate} OR full_gaid = ${bookGaidCandidate})
          AND xaid = ${userXaid}
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (bookCheck.length > 0) {
        const book = bookCheck[0] as any;
        // Use fullGaid if available (preferred), otherwise gaid
        projectGaid = book.full_gaid || book.gaid;
      } else {
        // Fallback to first segment
        projectGaid = bookGaidCandidate;
      }
    } else {
      // Parent is already a book, use its fullGaid (preferred) or gaid
      projectGaid = parentGoal.full_gaid || parentGoal.gaid;
    }
    
    console.log(`Finding scenes for parent: ${parentGaid}, fullGaid: ${parentFullGaid}, projectGaid: ${projectGaid}`);
    
    // Get all scenes under this parent (volume or chapter) using fullGaid
    const scenesResult = await env.DB.execute(sql`
      SELECT gaid, full_gaid
      FROM goals
      WHERE (full_gaid LIKE ${parentFullGaid + '/%'} OR full_gaid = ${parentFullGaid})
        AND type = 'scene'
        AND xaid = ${userXaid}
        AND deleted_at IS NULL
    `);
    
    console.log(`Found ${scenesResult.length} scenes`);

    const sceneGaids = (scenesResult as any[]).map((r) => r.gaid || r.full_gaid);

    // Get all assets for this project
    // Assets are created with xaid = projectGaid (can be fullGaid or gaid of the book)
    // We need to check both projectGaid (which might be fullGaid) and its gaid
    // Also check userXaid for personal assets
    const projectGaidParts = projectGaid.split('/');
    const projectGaidOnly = projectGaidParts[0] || projectGaid;
    
    const assetsResult = await env.DB.execute(sql`
      SELECT aaid, title, type_name
      FROM assets
      WHERE (xaid = ${projectGaid} OR xaid = ${projectGaidOnly} OR xaid = ${userXaid})
        AND deleted_at IS NULL
    `);
    
    console.log(`Found ${assetsResult.length} assets for project ${projectGaid} (or ${projectGaidOnly}) or user ${userXaid}`);

    // Get scene-asset relations (from texts.gin where goal_gaid matches scene)
    // For each scene, get its text and extract assets
    const relationsResult: any[] = [];
    
    // Get all texts at once for better performance
    const allTextsResult = await env.DB.execute(sql`
      SELECT gin, taid
      FROM texts
      WHERE deleted_at IS NULL
    `);
    
    console.log(`Found ${allTextsResult.length} total texts in database`);
    
    // Log all goal_gaids in texts for debugging
    const allGoalGaids: string[] = [];
    for (const textRow of allTextsResult as any[]) {
      try {
        const gin = textRow.gin;
        const ginData = typeof gin === 'string' ? JSON.parse(gin) : gin || {};
        if (ginData?.goal_gaid) {
          allGoalGaids.push(ginData.goal_gaid);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    console.log(`All goal_gaids in texts:`, allGoalGaids);
    console.log(`Looking for scenes with gaids:`, sceneGaids);
    
    for (const sceneRow of scenesResult as any[]) {
      const sceneGaid = sceneRow.gaid;
      const sceneFullGaid = sceneRow.full_gaid;
      
      // Search through all texts to find matching one
      let matchingText: any = null;
      
      for (const textRow of allTextsResult as any[]) {
        try {
          const gin = textRow.gin;
          const ginData = typeof gin === 'string' ? JSON.parse(gin) : gin || {};
          const goalGaidInGin = ginData?.goal_gaid;
          
          if (!goalGaidInGin) continue;
          
          // Check if this text belongs to our scene
          // goal_gaid can be stored as gaid, fullGaid, or as part of fullGaid
          // Try multiple matching strategies
          const matches = 
            goalGaidInGin === sceneGaid ||  // Exact match with gaid
            goalGaidInGin === sceneFullGaid ||  // Exact match with fullGaid
            (sceneFullGaid && goalGaidInGin === sceneFullGaid) ||  // Redundant but safe
            (sceneFullGaid && goalGaidInGin.endsWith(`/${sceneGaid}`)) ||  // fullGaid ends with /gaid
            (sceneFullGaid && sceneFullGaid.endsWith(`/${goalGaidInGin}`)) ||  // sceneFullGaid ends with goal_gaid
            (sceneGaid && goalGaidInGin.includes(sceneGaid));  // goal_gaid contains sceneGaid
          
          if (matches) {
            matchingText = textRow;
            console.log(`Found matching text for scene ${sceneGaid} (fullGaid: ${sceneFullGaid}): goal_gaid in gin = ${goalGaidInGin}`);
            break;
          }
        } catch (e) {
          console.error(`Error parsing gin for text ${textRow.taid}:`, e);
        }
      }
      
      if (matchingText) {
        const gin = matchingText.gin;
        // Parse gin if it's a string
        let ginData: any = {};
        try {
          ginData = typeof gin === 'string' ? JSON.parse(gin) : gin || {};
        } catch (e) {
          console.error(`Error parsing gin for scene ${sceneGaid}:`, e);
          ginData = {};
        }
        
        const characters = Array.isArray(ginData?.assets?.characters) ? ginData.assets.characters : [];
        const locations = Array.isArray(ginData?.assets?.locations) ? ginData.assets.locations : [];
        const items = Array.isArray(ginData?.assets?.items) ? ginData.assets.items : [];
        
        console.log(`Scene ${sceneGaid} (goal_gaid in gin: ${ginData?.goal_gaid}) has assets:`, {
          characters: characters.length,
          locations: locations.length,
          items: items.length,
          characterIds: characters,
          locationIds: locations,
          itemIds: items,
        });
        
        relationsResult.push({
          scene_gaid: sceneGaid,
          characters,
          locations,
          items,
        });
      } else {
        console.log(`No text found for scene ${sceneGaid} (fullGaid: ${sceneFullGaid})`);
      }
    }

    // Count scene usage for each asset
    const assetSceneCounts = new Map<string, number>();
    const assets = (assetsResult as any[]).map((a) => ({
      aaid: a.aaid,
      title: a.title,
      type_name: a.type_name,
      sceneCount: 0,
    }));

    assets.forEach((asset) => {
      assetSceneCounts.set(asset.aaid, 0);
    });

    relationsResult.forEach((rel) => {
      try {
        const characters = Array.isArray(rel.characters) ? rel.characters : [];
        const locations = Array.isArray(rel.locations) ? rel.locations : [];
        const items = Array.isArray(rel.items) ? rel.items : [];

        console.log(`Scene ${rel.scene_gaid} assets:`, { 
          characters: characters.length, 
          locations: locations.length, 
          items: items.length,
          characterIds: characters,
          locationIds: locations,
          itemIds: items,
        });

        // Process all asset IDs and count them
        const allAssetIds = [...characters, ...locations, ...items];
        console.log(`Processing ${allAssetIds.length} asset IDs for scene ${rel.scene_gaid}:`, allAssetIds);
        
        allAssetIds.forEach((aaid: string) => {
          if (aaid && typeof aaid === 'string') {
            const count = assetSceneCounts.get(aaid) || 0;
            assetSceneCounts.set(aaid, count + 1);
            console.log(`  Asset ${aaid}: count = ${count + 1}`);
          } else {
            console.warn(`  Invalid asset ID:`, aaid);
          }
        });
      } catch (e) {
        console.error("Error processing relation:", e, rel);
      }
    });
    
    console.log(`Final asset scene counts:`, Array.from(assetSceneCounts.entries()));

    // Update scene counts
    assets.forEach((asset) => {
      asset.sceneCount = assetSceneCounts.get(asset.aaid) || 0;
    });

    const result = {
      characters: assets.filter((a) => a.type_name === "character"),
      locations: assets.filter((a) => a.type_name === "location"),
      items: assets.filter((a) => a.type_name === "item"),
    };
    
    console.log(`Returning stats:`, {
      characters: result.characters.length,
      locations: result.locations.length,
      items: result.items.length,
      totalAssets: assets.length,
      relationsFound: relationsResult.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching asset stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset stats" },
      { status: 500 }
    );
  }
}

