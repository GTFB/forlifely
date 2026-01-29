import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "@/shared/types/shared";
import { getSession } from "@/shared/session";
import { buildRequestEnv } from "@/shared/env";
import { MeRepository } from "@/shared/repositories/me.repository";
import { MessageThreadsRepository } from "@/shared/repositories/message-threads.repository";
import { MessagesRepository } from "@/shared/repositories/messages.repository";
import { AIRepository } from "@/shared/repositories/ai-repository";

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
    const body = await request.json() as ChatRequest;
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check AI configuration
    if (!env.AI_API_URL || !env.AI_API_TOKEN) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Initialize repositories
    const threadRepo = MessageThreadsRepository.getInstance(env.DB);
    const messagesRepo = MessagesRepository.getInstance(env.DB);

    // Find or create thread for this user
    const thread = await threadRepo.findOrCreateByHaid(haid, 'ai_chat');
    const threadSettings = threadRepo.getThreadSettings(thread);

    // Get recent messages for context
    const recentMessages = await messagesRepo.getRecentMessages(
      thread.maid,
      threadSettings.context_length
    );

    // Get summary if exists
    const threadDataIn = typeof thread.dataIn === 'string' 
      ? JSON.parse(thread.dataIn) 
      : thread.dataIn || {};
    const summary = threadDataIn.summary;

    // Initialize AI repository
    const aiRepository = new AIRepository({
      env: {
        AI_API_URL: env.AI_API_URL,
        AI_API_TOKEN: env.AI_API_TOKEN,
        BOT_TOKEN: env.BOT_TOKEN,
        TRANSCRIPTION_MODEL: env.TRANSCRIPTION_MODEL,
      },
    });

    // Save user message
    await messagesRepo.createUserMessage(thread.maid, message);

    // Get AI response
    const aiResponse = await aiRepository.getAIResponse(
      recentMessages,
      message,
      threadSettings.prompt,
      threadSettings.model,
      summary
    );

    // Save AI response
    await messagesRepo.createAIMessage(thread.maid, aiResponse);

    // TODO: Implement summary generation when message count exceeds context_length
    // This can be done asynchronously or on a schedule

    const response: ChatResponse = {
      response: aiResponse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
