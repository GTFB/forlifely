import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import { Media, NewMedia } from '../schema/types'
import { generateAid } from '../generate-aid'

export class MediaRepository extends BaseRepository<Media> {
  constructor(db: D1Database) {
    super(db, schema.media)
  }

  public static getInstance(db: D1Database): MediaRepository {
    return new MediaRepository(db)
  }

  protected async beforeCreate(data: Partial<NewMedia>): Promise<void> {
    if (!data.maid) {
      data.maid = generateAid('m')
    }
  }
}

