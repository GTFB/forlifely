import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import type { Message, NewMessage } from '../schema/types'
import { generateAid } from '../generate-aid'
import { eq, and, desc, isNull, gt, sql } from 'drizzle-orm'
import type { EsnadSupportChatDataIn, EsnadSupportMessage, EsnadSupportMessageDataIn } from '../types/esnad-support'
import { parseJson } from './utils'
import { sendToRoom, sendToUser } from '@/packages/lib/socket'
import { MessageThreadsRepository } from './message-threads.repository'

export class MessagesRepository extends BaseRepository<Message> {
    constructor() {
        super(schema.messages)
    }

    public static getInstance(): MessagesRepository {
        return new MessagesRepository()
    }
    public async beforeCreate(data: Partial<NewMessage>): Promise<void> {
        if (!data.uuid) {
            data.uuid = crypto.randomUUID()
        }
        if (!data.fullMaid) {
            data.fullMaid = generateAid('fm')
        }
        if (!data.maid) {
            throw new Error('Message maid is required')
        }
        if (!data.dataIn) {
            data.dataIn = {}
        }
    }

    /**
     * Get all messages for a support chat by chat maid
     */
    public async findByChatMaid(chatMaid: string, limit: number = 100): Promise<EsnadSupportMessage[]> {
        const messages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt)
                )
            )
            .orderBy(desc(this.schema.createdAt))
            .limit(limit)
            .execute()

        return messages as EsnadSupportMessage[]
    }

    /**
     * Get paginated messages for a support chat by chat maid
     */
    public async findByChatMaidPaginated(chatMaid: string, page: number = 1, limit: number = 20): Promise<{
        messages: EsnadSupportMessage[]
        total: number
        hasMore: boolean
    }> {
        const offset = (page - 1) * limit

        // Get total count
        const allMessages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt)
                )
            )
            .execute()
        const total = allMessages.length

        // Get paginated messages (newest first)
        const messages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt)
                )
            )
            .orderBy(desc(this.schema.createdAt))
            .limit(limit)
            .offset(offset)
            .execute()

        return {
            messages: messages as EsnadSupportMessage[],
            total,
            hasMore: offset + limit < total,
        }
    }

    /**
     * Get new messages for a support chat after a specific timestamp
     */
    public async findNewMessagesAfterTimestamp(
        chatMaid: string,
        afterTimestamp: string,
        limit: number = 50
    ): Promise<EsnadSupportMessage[]> {
        // Convert string timestamp to Date object for drizzle-orm comparison
        const afterDate = new Date(afterTimestamp)

        const messages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt),
                    gt(this.schema.createdAt, afterDate)
                )
            )
            .orderBy(desc(this.schema.createdAt))
            .limit(limit)
            .execute()

        return messages as EsnadSupportMessage[]
    }

    /**
     * Mark messages as viewed for a specific role within a chat.
     * For client viewer -> marks admin messages; for admin viewer -> marks client messages.
     * Returns the number of updated messages.
     */
    public async markMessagesViewed(
        chatMaid: string,
        viewerRole: 'client' | 'admin',
        viewedAt?: string
    ): Promise<number> {
        const now = viewedAt ?? new Date().toISOString()
        const messageThreadsRepository = MessageThreadsRepository.getInstance()
        const chat = await messageThreadsRepository.findByMaid(chatMaid)
        if (!chat) {
            throw new Error('Chat not found')
        }
        const chatDataIn = chat.dataIn as EsnadSupportChatDataIn
        if (!chatDataIn) {
            throw new Error('Chat dataIn not found')
        }
        const messages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt)
                )
            )
            .orderBy(desc(this.schema.createdAt))
            .execute()

        let updatedCount = 0

        for (const message of messages) {
            const dataIn = parseJson<EsnadSupportMessageDataIn | Record<string, unknown>>(
                (message as any).dataIn,
                {} as EsnadSupportMessageDataIn
            )
            const senderRole = (dataIn as any).sender_role as 'client' | 'admin' | undefined
            if (viewerRole === 'client') {
                if (senderRole !== 'admin') {
                    continue
                }
                // Skip if already marked
                if ((dataIn as any).client_viewed_at) {
                    continue
                }
                const updatedDataIn = {
                    ...dataIn,
                    client_viewed_at: now,
                } as EsnadSupportMessageDataIn
                
                await this.update((message as any).uuid, { dataIn: updatedDataIn as any })
                try{
                    const clientHaid = chatDataIn?.humanHaid

                    await sendToRoom(`message:${message.uuid}`, 'viewed-message', {})
                    await sendToUser(clientHaid, 'update-client', {
                        type: 'client-updated-notices',
                        id: message.uuid,
                    })
                    await sendToUser(clientHaid, 'update-client', {
                        type: 'client-updated-support',
                    })
                } catch (socketError) {
                    console.error('Failed to send admin-updated-notices socket event:', socketError)
                    // Don't fail update if socket notification fails
                }
                updatedCount++
            } else {
                if (senderRole !== 'client') {
                    continue
                }
                if ((dataIn as any).admin_viewed_at) {
                    continue
                }
                const updatedDataIn = {
                    ...dataIn,
                    admin_viewed_at: now,
                } as EsnadSupportMessageDataIn
                try{
                    await sendToRoom(`message:${message.uuid}`, 'viewed-message', {})
                    
                    await sendToRoom('admin', 'update-admin', {
                        type: 'admin-updated-notices',
                    })
                    await sendToRoom('admin', 'update-admin', {
                      type: 'admin-updated-support',
                    })
                }catch (socketError) {
                    console.error('Failed to send admin-updated-notices socket event:', socketError)
                }
                await this.update((message as any).uuid, { dataIn: updatedDataIn as any })
                updatedCount++
            }
        }

        return updatedCount
    }

    /**
     * Check if a support chat has unread messages from clients (for admin)
     * Returns true if there's at least one message from a client that hasn't been read by admin
     */
    public async hasUnreadClientMessages(chatMaid: string): Promise<boolean> {
        const unreadMessages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt),
                    sql`COALESCE(${this.schema.dataIn}::jsonb->>'sender_role', '') = 'client'`,
                    sql`COALESCE(${this.schema.dataIn}::jsonb->>'admin_viewed_at', '') = ''`
                )
            )
            .limit(1)
            .execute()

        return unreadMessages.length > 0
    }

    /**
     * Check if a support chat has unread messages from admin (for client)
     * Returns true if there's at least one message from an admin that hasn't been read by client
     */
    public async hasUnreadAdminMessages(chatMaid: string): Promise<boolean> {
        const unreadMessages = await this.db
            .select()
            .from(this.schema)
            .where(
                and(
                    eq(this.schema.maid, chatMaid),
                    isNull(this.schema.deletedAt),
                    sql`COALESCE(${this.schema.dataIn}::jsonb->>'sender_role', '') = 'admin'`,
                    sql`COALESCE(${this.schema.dataIn}::jsonb->>'client_viewed_at', '') = ''`
                )
            )
            .limit(1)
            .execute()

        return unreadMessages.length > 0
    }
}


