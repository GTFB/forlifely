import { FileStorageService } from '../file-storage.service'
import { HumanRepository } from '../../repositories/human.repository'
import { DocumentRecognitionService } from './document-recognition.service'
import type { IFaceRecognitionProvider, IOcrProvider, FaceComparisonResult } from './providers'

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
    errors?: string[]
  }
  reasons?: string[]
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
   */
  async verifySelfieWithPassport(
    selfieMediaUuid: string,
    passportMediaUuid: string,
    humanUuid: string
  ): Promise<PassportSelfieVerificationResult> {
    const errors: string[] = []
    const reasons: string[] = []

    try {
      // 1. Get images from storage
      const [selfieBlob, passportBlob] = await Promise.all([
        this.fileStorageService.getFileContent(selfieMediaUuid),
        this.fileStorageService.getFileContent(passportMediaUuid),
      ])

      // 2. Convert to Uint8Array
      const [selfieBytes, passportBytes] = await Promise.all([
        this.blobToUint8Array(selfieBlob),
        this.blobToUint8Array(passportBlob),
      ])

      // 3. Compare faces using face provider
      const faceMatch = await this.faceProvider.compareFaces(selfieBytes, passportBytes, 0.8)

      const selfieFaces = faceMatch.sourceImageFaces ?? 0
      const passportFaces = faceMatch.targetImageFaces ?? 0

      if (selfieFaces === 0) {
        reasons.push('No face detected in selfie photo')
      }
      if (selfieFaces > 1) {
        reasons.push('Multiple faces detected in selfie (should be only one person)')
      }
      if (passportFaces === 0) {
        reasons.push('No face detected in passport photo')
      }

      if (!faceMatch.match) {
        reasons.push(
          `Faces do not match (similarity: ${(faceMatch.similarity * 100).toFixed(1)}%)`
        )
      }

      // 4. Extract name from passport using OCR
      const passportRecognition = await this.documentRecognitionService.recognizeDocument(
        passportMediaUuid
      )

      let passportName: string | undefined
      let nameMatch: {
        match: boolean
        passportName?: string
        userName?: string
        similarity?: number
      } = { match: false }

      if (passportRecognition.success && passportRecognition.recognizedData.fullName) {
        passportName = passportRecognition.recognizedData.fullName
      }

      // 5. Get user's name from database
      const human = await this.humanRepository.findByUuid(humanUuid)
      if (!human) {
        errors.push('Human record not found')
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
              `Name mismatch: passport "${passportName}" vs user "${userName}" (similarity: ${(nameSimilarity * 100).toFixed(1)}%)`
            )
          }
        } else {
          if (!passportName) {
            reasons.push('Could not extract name from passport')
          }
          if (!userName) {
            reasons.push('User name not found in database')
          }
        }
      }

      // 6. Determine overall verification result
      const verified = faceMatch.match && nameMatch.match && reasons.length === 0

      return {
        verified,
        faceMatch,
        nameMatch,
        details: {
          facesDetectedInSelfie: selfieFaces,
          facesDetectedInPassport: passportFaces,
          passportNameExtracted: !!passportName,
          errors: errors.length > 0 ? errors : undefined,
        },
        reasons: reasons.length > 0 ? reasons : undefined,
      }
    } catch (error) {
      console.error('Passport selfie verification error:', error)
      return {
        verified: false,
        faceMatch: { match: false, confidence: 0, similarity: 0, sourceImageFaces: 0, targetImageFaces: 0 },
        nameMatch: { match: false },
        details: {
          facesDetectedInSelfie: 0,
          facesDetectedInPassport: 0,
          passportNameExtracted: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
        reasons: ['Verification failed due to error'],
      }
    }
  }
}

