import { eq, and, isNull, desc, asc } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import BaseRepository from "./BaseRepositroy";
import { Message, NewMessage } from "../schema/types";
import { SiteDb, parseJson } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { generateAid } from "../generate-aid";
import type { RecentMessage, MessageToSummarize } from "./ai-repository";

export class MessagesRepository extends BaseRepository<Message> {
  private constructor(db: D1Database | SiteDb) {
    super(db, schema.messages);
  }

  public static getInstance(db: D1Database | SiteDb): MessagesRepository {
    return new MessagesRepository(db);
  }

  /**
   * Get recent messages for a thread
   * @param maid - Message thread aid
   * @param limit - Number of messages to retrieve
   * @returns Array of recent messages
   */
  async getRecentMessages(maid: string, limit: number = 10): Promise<RecentMessage[]> {
    const messages = await this.db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.maid, maid),
          isNull(schema.messages.deletedAt)
        )
      )
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit)
      .execute();

    // Reverse to get chronological order
    return messages.reverse().map(msg => ({
      title: msg.title || '',
      data_in: msg.dataIn || null
    }));
  }

  /**
   * Get all messages for a thread (for summarization)
   */
  async getAllMessagesByMaid(maid: string): Promise<MessageToSummarize[]> {
    const messages = await this.db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.maid, maid),
          isNull(schema.messages.deletedAt)
        )
      )
      .orderBy(asc(schema.messages.createdAt))
      .execute();

    return messages.map(msg => ({
      title: msg.title || '',
      data_in: msg.dataIn || null,
      full_maid: msg.fullMaid || msg.maid,
      created_at: msg.createdAt?.toString() || new Date().toISOString()
    }));
  }

  /**
   * Create a user message
   * @param maid - Thread maid (from message_threads.maid)
   * @param text - Message text
   */
  async createUserMessage(maid: string, text: string): Promise<Message> {
    const messageMaid = generateAid('msg');
    const newMessage: NewMessage = {
      uuid: uuidv4(),
      maid: maid, // Use thread maid
      fullMaid: messageMaid,
      title: text,
      statusName: 'sent',
      dataIn: {
        direction: 'incoming',
        isAIResponse: false
      }
    };

    const [created] = await this.db
      .insert(schema.messages)
      .values(newMessage)
      .returning();

    return created as Message;
  }

  /**
   * Create an AI response message
   * @param maid - Thread maid (from message_threads.maid)
   * @param text - Message text
   */
  async createAIMessage(maid: string, text: string): Promise<Message> {
    const messageMaid = generateAid('msg');
    const newMessage: NewMessage = {
      uuid: uuidv4(),
      maid: maid, // Use thread maid
      fullMaid: messageMaid,
      title: text,
      statusName: 'sent',
      dataIn: {
        direction: 'outgoing',
        isAIResponse: true
      }
    };

    const [created] = await this.db
      .insert(schema.messages)
      .values(newMessage)
      .returning();

    return created as Message;
  }
}


