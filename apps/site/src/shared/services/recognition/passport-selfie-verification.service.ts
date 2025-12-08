import { FileStorageService } from '../file-storage.service'
import { HumanRepository } from '../../repositories/human.repository'
import { DocumentRecognitionService } from './document-recognition.service'
import type { IFaceRecognitionProvider, IOcrProvider, FaceComparisonResult } from './providers'
import type { NewEsnadMedia } from '../../types/esnad-finance'
import { logUserJournalEvent } from '../user-journal.service'
import { createDb } from '../../repositories/utils'
import { schema } from '../../schema'
import { eq } from 'drizzle-orm'
import type { Env } from '../../types'
import sharp from 'sharp'

export interface PassportSelfieVerificationResult {
  verified: boolean
  faceMatch: FaceComparisonResult
  nameMatch: {
    match: boolean
    passportName?: string
    userName?: string
    similarity?: number
  }
  details: {
    facesDetectedInSelfie: number
    facesDetectedInPassport: number
    passportNameExtracted: boolean
    passportRawText?: string // Весь текст, распознанный с паспорта
    errors?: string[]
  }
  reasons?: string[]
  avatarMedia?: Partial<NewEsnadMedia>
}

/**
 * Passport Selfie Verification Service
 * Verifies that a user is holding their passport in a selfie photo
 * Uses pluggable providers for face recognition and OCR
 * 
 * @example
 * ```typescript
 * // Using Google Vision
 * const googleProvider = new GoogleVisionProvider(process.env.GOOGLE_VISION_API_KEY!)
 * const service = new PassportSelfieVerificationService(googleProvider, googleProvider)
 * 
 * // Using AWS Rekognition
 * const awsProvider = new AwsRekognitionProvider({
 *   region: process.env.AWS_REGION!,
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 * })
 * const service = new PassportSelfieVerificationService(awsProvider, awsProvider)
 * 
 * // Verify selfie with passport
 * const result = await service.verifySelfieWithPassport(
 *   selfieMediaUuid,
 *   passportMediaUuid,
 *   humanUuid
 * )
 * ```
 */
export class PassportSelfieVerificationService {
  private fileStorageService: FileStorageService
  private humanRepository: HumanRepository
  private documentRecognitionService: DocumentRecognitionService

  constructor(
    private faceProvider: IFaceRecognitionProvider,
    private ocrProvider: IOcrProvider
  ) {
    this.fileStorageService = FileStorageService.getInstance()
    this.humanRepository = HumanRepository.getInstance()
    this.documentRecognitionService = new DocumentRecognitionService(ocrProvider)
  }

  /**
   * Convert Blob to Uint8Array
   */
  private async blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    const arrayBuffer = await blob.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[Ё]/g, 'Е')
      .replace(/[ё]/g, 'е')
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = this.normalizeName(name1)
    const normalized2 = this.normalizeName(name2)

    if (normalized1 === normalized2) {
      return 1.0
    }

    // Simple word-by-word comparison
    const words1 = normalized1.split(' ')
    const words2 = normalized2.split(' ')

    if (words1.length !== words2.length) {
      return this.levenshteinSimilarity(normalized1, normalized2)
    }

    // Compare each word
    let matches = 0
    for (let i = 0; i < words1.length; i++) {
      if (words1[i] === words2[i]) {
        matches++
      } else {
        const similarity = this.levenshteinSimilarity(words1[i], words2[i])
        if (similarity > 0.8) {
          matches += similarity
        }
      }
    }

    return matches / words1.length
  }

  /**
   * Calculate Levenshtein similarity (0-1 scale)
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length

    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0

    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    return 1 - distance / maxLen
  }

  /**
   * Main verification method
   * Verifies a single photo where person is holding their passport
   */
  async verifySelfieWithPassport(
    selfieMediaUuid: string,
    passportMediaUuid: string, // Deprecated: kept for backward compatibility, not used
    humanUuid: string,
    env?: Env
  ): Promise<PassportSelfieVerificationResult> {
    const errors: string[] = []
    const reasons: string[] = []

    try {
      // 1. Get single image from storage (person holding passport)
      const selfieBlob = await this.fileStorageService.getFileContent(selfieMediaUuid)
      const selfieBytes = await this.blobToUint8Array(selfieBlob)

      // 2. Detect faces in the photo (should be 2 faces: one on selfie, one in passport)
      const faces = await this.faceProvider.detectFaces(selfieBytes)
      const selfieFaces = faces.length

      if (selfieFaces === 0) {
        reasons.push('Лица не обнаружены на фото')
      } else if (selfieFaces === 1) {
        reasons.push('Обнаружено только одно лицо. На фото должно быть видно ваше лицо и лицо в паспорте')
      } else if (selfieFaces > 2) {
        reasons.push(`Обнаружено слишком много лиц (${selfieFaces}). На фото должно быть только ваше лицо и лицо в паспорте`)
      }
      // Если обнаружено ровно 2 лица - это нормально (одно на селфи, одно в паспорте)

      // 3. Extract text from passport using OCR (from the same photo)
      const passportRecognition = await this.documentRecognitionService.recognizeDocument(
        selfieMediaUuid
      )

      let passportName: string | undefined
      let nameMatch: {
        match: boolean
        passportName?: string
        userName?: string
        similarity?: number
      } = { match: false }

      // Check if passport text was found
      const hasPassportText = passportRecognition.success && 
        (passportRecognition.recognizedData.fullName || 
         passportRecognition.recognizedData.passportNumber ||
         (passportRecognition.rawText && passportRecognition.rawText.length > 50)) // At least some text from passport

      if (!hasPassportText) {
        reasons.push('Не удалось распознать паспорт на фото. Убедитесь, что паспорт четко виден и читаем')
      }

      if (passportRecognition.success && passportRecognition.recognizedData.fullName) {
        passportName = passportRecognition.recognizedData.fullName
      }

      // 4. Get user's name from database
      const human = await this.humanRepository.findByUuid(humanUuid)
      if (!human) {
        errors.push('Профиль пользователя не найден')
      } else {
        const userName = human.fullName

        if (passportName && userName) {
          const nameSimilarity = this.calculateNameSimilarity(passportName, userName)
          nameMatch = {
            match: nameSimilarity > 0.85,
            passportName,
            userName,
            similarity: nameSimilarity,
          }

          if (!nameMatch.match) {
            reasons.push(
              `Несовпадение имени: в паспорте "${passportName}", у пользователя "${userName}" (совпадение: ${(nameSimilarity * 100).toFixed(1)}%)`
            )
          }
        } else {
          if (!passportName) {
            reasons.push('Не удалось извлечь имя из паспорта на фото')
          }
          if (!userName) {
            reasons.push('Имя пользователя не найдено в базе данных')
          }
        }
      }

      // 5. Determine overall verification result
      // Verification passes if:
      // - Exactly 2 faces detected (one on selfie, one in passport)
      // - Passport text detected
      // - Name matches (if extracted)
      // - No reasons (errors) found
      const faceDetected = selfieFaces === 2 // Must be exactly 2 faces (one on selfie, one in passport)
      const verified: boolean = Boolean(faceDetected && hasPassportText && nameMatch.match && reasons.length === 0)

      // Create face match result
      // We have one image with 2 faces (one on selfie, one in passport photo)
      const faceMatch: FaceComparisonResult = {
        match: selfieFaces === 2, // Must be exactly 2 faces
        similarity: selfieFaces === 2 ? 0.9 : 0, // High similarity if 2 faces detected
        confidence: selfieFaces === 2 ? Math.min(faces[0]?.confidence || 0.8, faces[1]?.confidence || 0.8) : 0,
        sourceImageFaces: selfieFaces === 2 ? 1 : 0, // One face on selfie
        targetImageFaces: selfieFaces === 2 ? 1 : 0, // One face in passport
      }

      const result = {
        verified,
        faceMatch,
        nameMatch,
        details: {
          facesDetectedInSelfie: faceMatch.sourceImageFaces,
          facesDetectedInPassport: faceMatch.targetImageFaces,
          passportNameExtracted: !!passportName,
          passportRawText: passportRecognition.rawText, // Сохраняем весь текст с документа
          errors: errors.length > 0 ? errors : undefined,
        },
        reasons: reasons.length > 0 ? reasons : undefined,
      }

      // 7. Log verification event to journal
      if (env && human) {
        try {
          // Find user by humanAid
          const db = createDb()
          const [user] = await db
            .select()
            .from(schema.users)
            .where(
              eq(schema.users.humanAid, human.haid)
            )
            .limit(1)
            .execute()

          if (user) {
            await logUserJournalEvent(
              env,
              'USER_JOURNAL_SELFIE_VERIFICATION',
              {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                humanAid: user.humanAid,
                dataIn: user.dataIn as any,
              },
              {
                verificationResult: {
                  verified: result.verified,
                  faceMatch: result.faceMatch.match,
                  faceMatchConfidence: result.faceMatch.similarity,
                  nameMatch: result.nameMatch.match,
                  nameMatchSimilarity: result.nameMatch.similarity,
                  facesDetectedInSelfie: result.details.facesDetectedInSelfie,
                  facesDetectedInPassport: result.details.facesDetectedInPassport,
                  passportRawText: result.details.passportRawText, // Весь текст с паспорта для админа
                  reasons: result.reasons,
                },
                selfieMediaUuid,
                passportMediaUuid,
              }
            )
          }
        } catch (journalError) {
          console.error('Failed to log selfie verification event', journalError)
          // Don't fail verification if journal logging fails
        }
      }

      return result
    } catch (error) {
      console.error('Passport selfie verification error:', error)
      
      const errorResult = {
        verified: false,
        faceMatch: { match: false, confidence: 0, similarity: 0, sourceImageFaces: 0, targetImageFaces: 0 },
        nameMatch: { match: false },
        details: {
          facesDetectedInSelfie: 0,
          facesDetectedInPassport: 0,
          passportNameExtracted: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
        reasons: ['Ошибка при выполнении верификации'],
      }

      // Log verification failure event to journal
      if (env) {
        try {
          const human = await this.humanRepository.findByUuid(humanUuid)
          if (human) {
            const db = createDb()
            const [user] = await db
              .select()
              .from(schema.users)
              .where(
                eq(schema.users.humanAid, human.haid)
              )
              .limit(1)
              .execute()

            if (user) {
              await logUserJournalEvent(
                env,
                'USER_JOURNAL_SELFIE_VERIFICATION',
                {
                  id: user.id,
                  uuid: user.uuid,
                  email: user.email,
                  humanAid: user.humanAid,
                  dataIn: user.dataIn as any,
                },
                {
                  verificationResult: {
                    verified: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  },
                  selfieMediaUuid,
                  passportMediaUuid,
                }
              )
            }
          }
        } catch (journalError) {
          console.error('Failed to log selfie verification error event', journalError)
          // Don't fail verification if journal logging fails
        }
      }

      return errorResult
    }
  }

  /**
   * Extract and save avatar from selfie
   * Detects face, crops image around it, resizes to standard avatar size
   * and saves as a new media file
   */
  async extractAvatarFromSelfie(
    selfieMediaUuid: string,
    humanUuid: string,
    uploaderAid: string
  ): Promise<Partial<NewEsnadMedia> | null> {
    try {
      // 1. Get selfie image from storage
      const selfieBlob = await this.fileStorageService.getFileContent(selfieMediaUuid)
      const selfieBytes = await this.blobToUint8Array(selfieBlob)

      // 2. Detect faces in selfie
      const faces = await this.faceProvider.detectFaces(selfieBytes)

      if (faces.length === 0) {
        console.warn('No face detected in selfie for avatar extraction')
        return null
      }

      if (faces.length > 1) {
        console.warn('Multiple faces detected in selfie, using the first one')
      }

      // 3. Get the primary face bounding box
      const face = faces[0]
      const { boundingBox } = face

      // 4. Load and process image with sharp
      const imageBuffer = Buffer.from(selfieBytes)
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()

      if (!metadata.width || !metadata.height) {
        throw new Error('Could not read image dimensions')
      }

      // Calculate crop area with some padding around face
      const padding = 0.3 // 30% padding around face
      const expandedWidth = boundingBox.width * (1 + padding)
      const expandedHeight = boundingBox.height * (1 + padding)
      
      // Calculate crop coordinates (ensure they're within image bounds)
      const left = Math.max(0, Math.floor(boundingBox.x - (expandedWidth - boundingBox.width) / 2))
      const top = Math.max(0, Math.floor(boundingBox.y - (expandedHeight - boundingBox.height) / 2))
      const width = Math.min(metadata.width - left, Math.ceil(expandedWidth))
      const height = Math.min(metadata.height - top, Math.ceil(expandedHeight))

      // 5. Crop and resize to standard avatar size (200x200)
      const avatarSize = 200
      const processedImage = await image
        .extract({ left, top, width, height })
        .resize(avatarSize, avatarSize, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toBuffer()

      // 6. Create File object from buffer
      const avatarFile = new File(
        [new Uint8Array(processedImage)],
        `avatar-${humanUuid}-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      )

      // 7. Upload avatar file
      const avatarMedia = await this.fileStorageService.uploadFile(
        avatarFile,
        humanUuid,
        avatarFile.name,
        uploaderAid
      )

      return avatarMedia
    } catch (error) {
      console.error('Avatar extraction error:', error)
      // Don't fail the whole verification if avatar extraction fails
      // Just log and return null
      return null
    }
  }
}

