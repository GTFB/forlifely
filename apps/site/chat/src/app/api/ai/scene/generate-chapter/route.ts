import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/session";
import { buildRequestEnv } from "@/shared/env";
import { MeRepository } from "@/shared/repositories/me.repository";
import { MessageThreadsRepository } from "@/shared/repositories/message-threads.repository";
import { AIRepository } from "@/shared/repositories/ai-repository";
import { sql } from "drizzle-orm";
import { parseJson } from "@/shared/repositories/utils";

interface GenerateChapterRequest {
  characterAaids: string[];
  locationAaids: string[];
  itemAaids: string[];
  sceneDescription: string;
}

export async function POST(request: NextRequest) {
  try {
    const env = buildRequestEnv();

    if (!env.AUTH_SECRET) {
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      );
    }

    // Get user from session
    const sessionUser = await getSession(request, env.AUTH_SECRET);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user with human data
    const meRepository = MeRepository.getInstance(env.DB);
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id), {
      includeHuman: true,
    });

    if (!userWithRoles || !userWithRoles.human) {
      return NextResponse.json(
        { error: "User or human data not found" },
        { status: 404 }
      );
    }

    const haid = userWithRoles.human.haid;

    // Parse request body
    const body = await request.json() as GenerateChapterRequest;
    const { characterAaids, locationAaids, itemAaids, sceneDescription } = body;

    // Check AI configuration
    if (!env.AI_API_URL || !env.AI_API_TOKEN) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Initialize repositories
    const threadRepo = MessageThreadsRepository.getInstance(env.DB);

    // Find or create thread with type 'chapter_generator'
    const thread = await threadRepo.findOrCreateByHaid(haid, 'chapter_generator');
    const threadSettings = threadRepo.getThreadSettings(thread);

    // Get prompt and model from thread settings
    const prompt = threadSettings.prompt;
    const model = threadSettings.model;

    // Get all asset aaid's
    const allAaids = [...characterAaids, ...locationAaids, ...itemAaids];

    // Fetch assets from database with their descriptions
    let assetsData: Array<{ aaid: string; title: string; type_name: string; description?: string }> = [];
    
    if (allAaids.length > 0) {
      // Use raw SQL with proper PostgreSQL array syntax
      const escapedAaids = allAaids.map(a => `'${String(a).replace(/'/g, "''")}'`).join(',');
      const assetsResult = await env.DB.execute(
        sql.raw(`SELECT aaid, title, type_name, gin FROM assets WHERE aaid = ANY(ARRAY[${escapedAaids}]) AND deleted_at IS NULL`)
      );

      const assets = Array.isArray(assetsResult) ? assetsResult : [];
      
      // Extract descriptions from gin field
      assetsData = assets.map((asset: any) => {
        let description = '';
        try {
          const gin = parseJson(asset.gin, {});
          // Try to find description in gin (could be in different fields)
          description = gin.description || gin.content || gin.text || '';
        } catch (e) {
          console.warn(`Failed to parse gin for asset ${asset.aaid}:`, e);
        }
        
        return {
          aaid: asset.aaid,
          title: asset.title || '',
          type_name: asset.type_name || '',
          description: description,
        };
      });
    }

    // Separate assets by type
    const characters = assetsData.filter(a => characterAaids.includes(a.aaid));
    const locations = assetsData.filter(a => locationAaids.includes(a.aaid));
    const items = assetsData.filter(a => itemAaids.includes(a.aaid));

    // Build context message for AI
    let contextParts: string[] = [];

    if (characters.length > 0) {
      const charactersText = characters
        .map(c => {
          const desc = c.description ? ` - ${c.description}` : '';
          return `- ${c.title}${desc}`;
        })
        .join('\n');
      contextParts.push(`CHARACTERS:\n${charactersText}`);
    }

    if (locations.length > 0) {
      const locationsText = locations
        .map(l => {
          const desc = l.description ? ` - ${l.description}` : '';
          return `- ${l.title}${desc}`;
        })
        .join('\n');
      contextParts.push(`LOCATIONS:\n${locationsText}`);
    }

    if (items.length > 0) {
      const itemsText = items
        .map(i => {
          const desc = i.description ? ` - ${i.description}` : '';
          return `- ${i.title}${desc}`;
        })
        .join('\n');
      contextParts.push(`ITEMS:\n${itemsText}`);
    }

    if (sceneDescription.trim()) {
      contextParts.push(`SCENE DESCRIPTION:\n${sceneDescription}`);
    }

    const contextMessage = contextParts.join('\n\n');

    // Initialize AI repository
    const aiRepository = new AIRepository({
      env: {
        AI_API_URL: env.AI_API_URL,
        AI_API_TOKEN: env.AI_API_TOKEN,
      },
    });

    // Build user message with context
    const userMessage = contextMessage || "Generate a chapter text.";

    // Call AI with empty recent messages (no context needed for chapter generation)
    const aiResponse = await aiRepository.getAIResponse(
      [], // No recent messages needed
      userMessage,
      prompt,
      model
    );

    return NextResponse.json({ 
      content: aiResponse 
    });
  } catch (error) {
    console.error("Generate chapter error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate chapter", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

