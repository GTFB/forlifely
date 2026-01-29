import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/session";
import { buildRequestEnv } from "@/shared/env";
import { MeRepository } from "@/shared/repositories/me.repository";
import { MessageThreadsRepository } from "@/shared/repositories/message-threads.repository";
import { AIRepository } from "@/shared/repositories/ai-repository";

interface GenerateDescriptionRequest {
  currentDescription: string;
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
    const body = await request.json() as GenerateDescriptionRequest;
    const { currentDescription } = body;

    // Check AI configuration
    if (!env.AI_API_URL || !env.AI_API_TOKEN) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Initialize repositories
    const threadRepo = MessageThreadsRepository.getInstance(env.DB);

    // Find or create thread with type 'scene_editor'
    const thread = await threadRepo.findOrCreateByHaid(haid, 'scene_editor');
    const threadSettings = threadRepo.getThreadSettings(thread);

    // Get prompt and model from thread settings
    const prompt = threadSettings.prompt;
    const model = threadSettings.model;

    // Initialize AI repository
    const aiRepository = new AIRepository({
      env: {
        AI_API_URL: env.AI_API_URL,
        AI_API_TOKEN: env.AI_API_TOKEN,
      },
    });

    // Build message for AI: include current description if it exists
    const messageText = currentDescription.trim()
      ? `Generate or improve the scene description. Current description: ${currentDescription}`
      : "Generate a scene description.";

    // Call AI with empty recent messages (no context needed for description generation)
    const aiResponse = await aiRepository.getAIResponse(
      [], // No recent messages needed
      messageText,
      prompt,
      model
    );

    return NextResponse.json({ 
      description: aiResponse 
    });
  } catch (error) {
    console.error("Generate description error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate description", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

