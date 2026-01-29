import { eq, and, isNull, desc } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import BaseRepository from "./BaseRepositroy";
import { MessageThread, NewMessageThread } from "../schema/types";
import { SiteDb, parseJson } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { generateAid } from "../generate-aid";

export class MessageThreadsRepository extends BaseRepository<MessageThread> {
  private constructor(db: D1Database | SiteDb) {
    super(db, schema.messageThreads);
  }

  public static getInstance(db: D1Database | SiteDb): MessageThreadsRepository {
    return new MessageThreadsRepository(db);
  }

  /**
   * Find or create a chat thread for a user
   * @param haid - Human aid (user identifier)
   * @param type - Thread type (e.g., 'ai_chat')
   * @returns MessageThread
   */
  async findOrCreateByHaid(haid: string, type: string = 'ai_chat'): Promise<MessageThread> {
    // Try to find existing thread
    const existing = await this.db
      .select()
      .from(schema.messageThreads)
      .where(
        and(
          eq(schema.messageThreads.xaid, haid),
          eq(schema.messageThreads.type, type),
          isNull(schema.messageThreads.deletedAt)
        )
      )
      .limit(1)
      .execute();

    if (existing.length > 0) {
      return existing[0] as MessageThread;
    }

    // Create new thread
    const maid = generateAid('mt');
    const newThread: NewMessageThread = {
      uuid: uuidv4(),
      maid: maid,
      xaid: haid,
      type: type,
      title: 'AI Chat',
      statusName: 'active',
      dataIn: {
        prompt: "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
        model: "gemini-2.5-flash",
        context_length: 6
      }
    };

    const [created] = await this.db
      .insert(schema.messageThreads)
      .values(newThread)
      .returning();

    return created as MessageThread;
  }

  /**
   * Get thread by maid
   */
  async findByMaid(maid: string): Promise<MessageThread | null> {
    const threads = await this.db
      .select()
      .from(schema.messageThreads)
      .where(
        and(
          eq(schema.messageThreads.maid, maid),
          isNull(schema.messageThreads.deletedAt)
        )
      )
      .limit(1)
      .execute();

    return threads.length > 0 ? (threads[0] as MessageThread) : null;
  }

  /**
   * Get thread settings (prompt, model, context_length) from data_in
   */
  getThreadSettings(thread: MessageThread): {
    prompt: string;
    model: string;
    context_length: number;
  } {
    const defaultSettings = {
      prompt: "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
      model: "gemini-2.5-flash",
      context_length: 6
    };

    if (!thread.dataIn) {
      return defaultSettings;
    }

    const dataIn = parseJson<{
      prompt?: string;
      model?: string;
      context_length?: number;
    }>(thread.dataIn, {});

    return {
      prompt: dataIn.prompt || defaultSettings.prompt,
      model: dataIn.model || defaultSettings.model,
      context_length: dataIn.context_length || defaultSettings.context_length,
    };
  }

  /**
   * Update thread settings in data_in
   */
  async updateThreadSettings(
    maid: string,
    settings: {
      prompt?: string;
      model?: string;
      context_length?: number;
    }
  ): Promise<void> {
    const thread = await this.findByMaid(maid);
    if (!thread) {
      throw new Error(`Thread with maid ${maid} not found`);
    }

    const currentDataIn = parseJson<{
      prompt?: string;
      model?: string;
      context_length?: number;
    }>(thread.dataIn, {});

    const updatedDataIn = {
      ...currentDataIn,
      ...settings
    };

    await this.db
      .update(schema.messageThreads)
      .set({
        dataIn: updatedDataIn,
        updatedAt: new Date()
      })
      .where(eq(schema.messageThreads.maid, maid));
  }

  /**
   * Update summary in thread data_in
   */
  async updateSummary(maid: string, summary: string, summaryVersion: number): Promise<void> {
    const thread = await this.findByMaid(maid);
    if (!thread) {
      throw new Error(`Thread with maid ${maid} not found`);
    }

    const currentDataIn = parseJson<{
      prompt?: string;
      model?: string;
      context_length?: number;
      summary?: string;
      summary_version?: number;
    }>(thread.dataIn, {});

    const updatedDataIn = {
      ...currentDataIn,
      summary,
      summary_version: summaryVersion
    };

    await this.db
      .update(schema.messageThreads)
      .set({
        dataIn: updatedDataIn,
        updatedAt: new Date()
      })
      .where(eq(schema.messageThreads.maid, maid));
  }
}

