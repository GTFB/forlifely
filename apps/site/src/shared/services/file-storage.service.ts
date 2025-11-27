import { LocalStorageProvider, IStorageProvider } from './storage.provider'
import { MediaRepository } from '@/shared/repositories/media.repository'
import { NewEsnadMedia } from '@/shared/types/esnad-finance'

export class FileStorageService {
  private provider: IStorageProvider
  private mediaRepository: MediaRepository

  constructor() {
    this.provider = new LocalStorageProvider()
    this.mediaRepository = MediaRepository.getInstance()
  }

  public static getInstance(): FileStorageService {
    return new FileStorageService()
  }

  async uploadFile(file: Blob, filename: string, uploaderAid?: string): Promise<any> {
    // 1. Save physical file
    const savedFile = await this.provider.save(file, filename)

    // 2. Save metadata to DB (Media entity)
    const mediaData: Partial<NewEsnadMedia> = {
      uuid: crypto.randomUUID(),
      fileName: filename,
      filePath: savedFile.path,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.size.toString(),
      url: savedFile.url,
      uploaderAid: uploaderAid,
      isPublic: 0, // Private by default
      type: savedFile.mimeType.split('/')[0], // image, application, etc.
      dataIn: {}
    }

    const createdMedia = await this.mediaRepository.create(mediaData)
    return createdMedia
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

