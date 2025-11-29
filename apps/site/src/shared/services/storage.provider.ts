import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export interface IStorageProvider {
  save(file: Blob, filename: string): Promise<{ path: string; url: string; size: number; mimeType: string }>
  get(path: string): Promise<Blob>
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string

  constructor(uploadDir = '../../data/site') {
    this.uploadDir = path.join(process.cwd(), uploadDir)
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  async save(file: Blob, filename: string) {
    await this.ensureUploadDir()
    
    const ext = path.extname(filename)
    const uniqueName = `${randomUUID()}${ext}`
    const relativePath = path.join('uploads', uniqueName) // Relative path for DB
    const absolutePath = path.join(this.uploadDir, uniqueName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(absolutePath, buffer)

    return {
      path: relativePath,
      url: `/api/assets/${uniqueName}`, // Public URL via API route
      size: file.size,
      mimeType: file.type
    }
  }

  async get(filePath: string): Promise<Blob> {
      // Assuming filePath comes from the DB as 'uploads/filename.ext' or just filename
      // We need to map it back to absolute path in data/site
      const filename = path.basename(filePath)
      const absolutePath = path.join(this.uploadDir, filename)
      
      if (!existsSync(absolutePath)) {
        throw new Error('File not found')
      }

      const buffer = await readFile(absolutePath)
      // We don't store mimeType with file content on disk easily, 
      // usually it comes from DB metadata. For Blob we need it.
      // For this simple implementation we might need to guess or pass it.
      // But Blob constructor takes options.
      return new Blob([buffer]) 
  }
}

