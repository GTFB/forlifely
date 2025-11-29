import BaseRepository from './BaseRepositroy'
import { Setting, NewSetting } from '../schema/types'
import { schema } from '../schema'
import { eq } from 'drizzle-orm'

export class SettingsRepository extends BaseRepository<Setting> {
  constructor() {
    super(schema.settings)
  }

  public static getInstance(): SettingsRepository {
    return new SettingsRepository()
  }


  /**
   * Find setting by attribute
   */
  public async findByAttribute(attribute: string): Promise<Setting | null> {
    const [setting] = await this.db
      .select()
      .from(this.schema)
      .where(eq(this.schema.attribute, attribute))
      .limit(1)
      .execute()
    
    return (setting as Setting) || null
  }

  /**
   * Update setting by UUID
   */
  public async updateByUuid(
    uuid: string,
    data: Partial<NewSetting>
  ): Promise<Setting> {
    return await this.update(uuid, data)
  }
}

