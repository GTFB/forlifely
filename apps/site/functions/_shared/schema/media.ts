import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core'

export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull(),
  maid: text('maid'),
  title: text('title'),
  altText: text('alt_text'),
  caption: text('caption'),
  fileName: text('file_name'),
  filePath: text('file_path'),
  mimeType: text('mime_type'),
  sizeBytes: numeric('size_bytes'),
  isPublic: integer('is_public').default(1),
  type: text('type'),
  uploaderAid: text('uploader_aid'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: text('updated_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  createdAt: text('created_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  deletedAt: numeric('deleted_at'),
  dataIn: text('data_in', { mode: 'json' }),
  url: text('url'),
  thumbnailUrl: text('thumbnail_u_r_l'),
  filename: text('filename'),
  filesize: numeric('filesize'),
  width: numeric('width'),
  height: numeric('height'),
  focalX: numeric('focal_x'),
  focalY: numeric('focal_y'),
})


