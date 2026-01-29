import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/session";
import { buildRequestEnv } from "@/shared/env";
import { MeRepository } from "@/shared/repositories/me.repository";
import { MessageThreadsRepository } from "@/shared/repositories/message-threads.repository";
import { MessagesRepository } from "@/shared/repositories/messages.repository";
import { parseJson } from "@/shared/repositories/utils";

interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
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

    // Initialize repositories
    const threadRepo = MessageThreadsRepository.getInstance(env.DB);
    const messagesRepo = MessagesRepository.getInstance(env.DB);

    // Find or create thread for this user
    const thread = await threadRepo.findOrCreateByHaid(haid, 'ai_chat');

    // Get all messages for this thread
    const dbMessages = await messagesRepo.getAllMessagesByMaid(thread.maid);

    // Transform messages from DB format to component format
    const historyMessages: ChatHistoryMessage[] = dbMessages.map((msg) => {
      // Determine role based on data_in
      let role: "user" | "assistant" = "user";
      
      const dataIn = parseJson<{
        direction?: 'incoming' | 'outgoing';
        isAIResponse?: boolean;
      }>(msg.data_in, {});
      
      const direction = dataIn.direction || 'incoming';
      const isAIResponse = dataIn.isAIResponse || false;
      
      if (isAIResponse || direction === 'outgoing') {
        role = "assistant";
      } else {
        role = "user";
      }

      return {
        id: msg.full_maid || `msg-${Date.now()}-${Math.random()}`,
        role: role,
        content: msg.title || '',
        timestamp: msg.created_at,
      };
    });

    return NextResponse.json({ messages: historyMessages });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { 
        error: "Failed to load chat history", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

