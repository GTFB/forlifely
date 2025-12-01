import { LocalStorageProvider, DatabaseStorageProvider, IStorageProvider } from './storage.provider'
import { MediaRepository } from '@/shared/repositories/media.repository'
import { NewEsnadMedia } from '@/shared/types/esnad-finance'

export class FileStorageService {
  private provider: IStorageProvider
  private mediaRepository: MediaRepository

  constructor() {
    // Choose storage provider based on environment:
    // FILE_STORAGE_DRIVER=database -> DatabaseStorageProvider
    // otherwise LocalStorageProvider (filesystem)
    this.provider = new DatabaseStorageProvider()
    
    this.mediaRepository = MediaRepository.getInstance()
  }

  public static getInstance(): FileStorageService {
    return new FileStorageService()
  }

  async uploadFile(file: Blob, entityUuid: string, filename: string, uploaderAid?: string): Promise<any> {
    // 1. Generate media UUID (used both for media record and files table)
    const mediaUuid = crypto.randomUUID()

    // 2. First create Media record so that any FK (e.g. in files table) can safely reference it
    const initialMediaData: Partial<NewEsnadMedia> = {
      uuid: mediaUuid,
      fileName: filename,
      mimeType: file.type,
      sizeBytes: file.size.toString(),
      uploaderAid: uploaderAid,
      isPublic: 0, // Private by default
      type: file.type?.split('/')[0], // image, application, etc.
      dataIn: { entityUuid },
    }

    const createdMedia = await this.mediaRepository.create(initialMediaData)

    // 3. Save file content using selected storage provider (may create records linked to mediaUuid)
    const savedFile = await this.provider.save(file, filename, mediaUuid)

    // 4. Update Media metadata with actual storage info (path/url/size/mime type)
    const updatedMedia = await this.mediaRepository.update(createdMedia.uuid, {
      filePath: savedFile.path,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.size.toString(),
      url: savedFile.url,
      type: savedFile.mimeType.split('/')[0],
    } as Partial<NewEsnadMedia>)

    return updatedMedia
  }

  async getFileContent(uuid: string): Promise<Blob> {
    const media = await this.mediaRepository.findByUuid(uuid)
    if (!media || !media.filePath) {
      throw new Error('Media not found')
    }
    
    return this.provider.get(media.filePath)
  }
  
  async getMediaMetadata(uuid: string) {
      return this.mediaRepository.findByUuid(uuid)
  }
}

