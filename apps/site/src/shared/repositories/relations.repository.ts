import { eq, and, isNull } from 'drizzle-orm'
import type { Relation, NewRelation } from '../schema/types'
import { schema } from '../schema/schema'
import BaseRepository from './BaseRepositroy'
import { generateAid } from '@/shared/generate-aid'

export class RelationsRepository extends BaseRepository<Relation> {
  private static instance: RelationsRepository | null = null

  private constructor() {
    super(schema.relations)
  }

  public static getInstance(): RelationsRepository {
    if (!RelationsRepository.instance) {
      RelationsRepository.instance = new RelationsRepository()
    }
    return RelationsRepository.instance
  }

  /**
   * Find all relations by source entity and type
   */
  async findBySourceEntity(sourceEntity: string, type?: string): Promise<Relation[]> {
    const conditions = [
      eq(this.schema.sourceEntity, sourceEntity),
      isNull(this.schema.deletedAt),
    ]
    
    if (type) {
      conditions.push(eq(this.schema.type, type))
    }

    return (await this.db
      .select()
      .from(this.schema)
      .where(and(...conditions))
      .execute()) as Relation[]
  }

  /**
   * Find all relations by target entity and type
   */
  async findByTargetEntity(targetEntity: string, type?: string): Promise<Relation[]> {
    const conditions = [
      eq(this.schema.targetEntity, targetEntity),
      isNull(this.schema.deletedAt),
    ]
    
    if (type) {
      conditions.push(eq(this.schema.type, type))
    }

    return (await this.db
      .select()
      .from(this.schema)
      .where(and(...conditions))
      .execute()) as Relation[]
  }

  /**
   * Find relation by source and target entities
   */
  async findBySourceAndTarget(
    sourceEntity: string,
    targetEntity: string,
    type?: string
  ): Promise<Relation | null> {
    const conditions = [
      eq(this.schema.sourceEntity, sourceEntity),
      eq(this.schema.targetEntity, targetEntity),
      isNull(this.schema.deletedAt),
    ]
    
    if (type) {
      conditions.push(eq(this.schema.type, type))
    }

    const result = (await this.db
      .select()
      .from(this.schema)
      .where(and(...conditions))
      .limit(1)
      .execute()) as Relation[]

    return result[0] || null
  }

  /**
   * Create multiple relations
   */
  async createMany(relations: NewRelation[]): Promise<Relation[]> {
    const created: Relation[] = []
    
    for (const relation of relations) {
      const newRelation: NewRelation = {
        ...relation,
        uuid: relation.uuid || crypto.randomUUID(),
        xaid: relation.xaid || generateAid('x'),
      }
      
      const result = await this.create(newRelation)
      created.push(result)
    }
    
    return created
  }

  /**
   * Delete relations by source entity and type (soft delete)
   */
  async deleteBySourceEntity(sourceEntity: string, type?: string): Promise<void> {
    const conditions = [
      eq(this.schema.sourceEntity, sourceEntity),
      isNull(this.schema.deletedAt),
    ]
    
    if (type) {
      conditions.push(eq(this.schema.type, type))
    }

    await this.db
      .update(this.schema)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(...conditions))
      .execute()
  }

  /**
   * Replace relations for a source entity (delete old, create new)
   */
  async replaceRelations(
    sourceEntity: string,
    targetEntities: string[],
    type: string,
    order?: number
  ): Promise<Relation[]> {
    // Soft delete existing relations
    await this.deleteBySourceEntity(sourceEntity, type)

    // Create new relations
    const newRelations: NewRelation[] = targetEntities.map((targetEntity, index) => ({
      sourceEntity,
      targetEntity,
      type,
      order: String(order !== undefined ? order + index : index),
    }))

    return this.createMany(newRelations)
  }
}

