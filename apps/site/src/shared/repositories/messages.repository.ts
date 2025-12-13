import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import type { Message, NewMessage } from '../schema/types'
import { generateAid } from '../generate-aid'
import { eq, and, desc, isNull } from 'drizzle-orm'
import type { EsnadSupportMessage } from '../types/esnad-support'

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
        if(! data.dataIn) {
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

}


