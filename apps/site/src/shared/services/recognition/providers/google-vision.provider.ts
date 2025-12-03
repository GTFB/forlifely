import type {
  IFaceRecognitionProvider,
  IOcrProvider,
  FaceDetection,
  FaceComparisonResult,
  OcrResult,
  TextDetection,
} from './types'

/**
 * Google Vision API Provider
 * Implements face recognition and OCR using Google Cloud Vision API
 */
export class GoogleVisionProvider implements IFaceRecognitionProvider, IOcrProvider {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Vision API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    const binaryString = String.fromCharCode(...bytes)
    return btoa(binaryString)
  }

  /**
   * Detect faces in an image using Google Vision API
   */
  async detectFaces(imageBytes: Uint8Array): Promise<FaceDetection[]> {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`
    const imageBase64 = this.uint8ArrayToBase64(imageBytes)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'FACE_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as any

    if (data.responses?.[0]?.error) {
      throw new Error(`Google Vision API error: ${JSON.stringify(data.responses[0].error)}`)
    }

    const faceAnnotations = data.responses?.[0]?.faceAnnotations || []

    return faceAnnotations.map((face: any) => {
      const vertices = face.boundingPoly?.vertices || []
      const minX = Math.min(...vertices.map((v: any) => v.x || 0))
      const minY = Math.min(...vertices.map((v: any) => v.y || 0))
      const maxX = Math.max(...vertices.map((v: any) => v.x || 0))
      const maxY = Math.max(...vertices.map((v: any) => v.y || 0))

      return {
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        confidence: face.detectionConfidence || 0,
        landmarks: face.landmarks?.map((landmark: any) => ({
          type: landmark.type,
          position: {
            x: landmark.position.x || 0,
            y: landmark.position.y || 0,
          },
        })),
      }
    })
  }

  /**
   * Compare two faces using Google Vision API
   * Note: Google Vision doesn't have direct face comparison API,
   * so we detect faces and compare their landmarks manually
   */
  async compareFaces(
    sourceImageBytes: Uint8Array,
    targetImageBytes: Uint8Array,
    similarityThreshold: number = 0.8
  ): Promise<FaceComparisonResult> {
    try {
      // Detect faces in both images
      const [sourceFaces, targetFaces] = await Promise.all([
        this.detectFaces(sourceImageBytes),
        this.detectFaces(targetImageBytes),
      ])

      if (sourceFaces.length === 0 || targetFaces.length === 0) {
        return {
          match: false,
          similarity: 0,
          confidence: 0,
          sourceImageFaces: sourceFaces.length,
          targetImageFaces: targetFaces.length,
        }
      }

      // Use the first detected face from each image
      const sourceFace = sourceFaces[0]
      const targetFace = targetFaces[0]

      // Calculate similarity based on landmarks
      let similarity = 0
      if (sourceFace.landmarks && targetFace.landmarks && sourceFace.landmarks.length > 0) {
        similarity = this.calculateLandmarkSimilarity(sourceFace.landmarks, targetFace.landmarks)
      } else {
        // Fallback: use bounding box similarity
        similarity = this.calculateBoundingBoxSimilarity(sourceFace.boundingBox, targetFace.boundingBox)
      }

      const confidence = Math.min(sourceFace.confidence, targetFace.confidence)
      const match = similarity >= similarityThreshold && confidence >= 0.7

      return {
        match,
        similarity,
        confidence,
        sourceImageFaces: sourceFaces.length,
        targetImageFaces: targetFaces.length,
      }
    } catch (error) {
      console.error('Google Vision face comparison error:', error)
      throw error
    }
  }

  /**
   * Calculate similarity between two sets of landmarks
   */
  private calculateLandmarkSimilarity(
    landmarks1: Array<{ type: string; position: { x: number; y: number } }>,
    landmarks2: Array<{ type: string; position: { x: number; y: number } }>
  ): number {
    if (landmarks1.length === 0 || landmarks2.length === 0) {
      return 0
    }

    let totalDistance = 0
    let count = 0

    for (const l1 of landmarks1) {
      const l2 = landmarks2.find((l) => l.type === l1.type)

      if (l2) {
        const distance = Math.sqrt(
          Math.pow(l1.position.x - l2.position.x, 2) + Math.pow(l1.position.y - l2.position.y, 2)
        )
        totalDistance += distance
        count++
      }
    }

    if (count === 0) return 0

    // Normalize distance (assuming average face size ~200px)
    const avgDistance = totalDistance / count
    const normalizedDistance = Math.min(avgDistance / 200, 1)

    return 1 - normalizedDistance
  }

  /**
   * Calculate similarity between two bounding boxes
   */
  private calculateBoundingBoxSimilarity(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number }
  ): number {
    const area1 = box1.width * box1.height
    const area2 = box2.width * box2.height

    if (area1 === 0 || area2 === 0) return 0

    const sizeSimilarity = Math.min(area1, area2) / Math.max(area1, area2)

    return sizeSimilarity
  }

  /**
   * Detect text in an image using Google Vision API
   */
  async detectText(imageBytes: Uint8Array): Promise<OcrResult> {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`
    const imageBase64 = this.uint8ArrayToBase64(imageBytes)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Vision API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as any

    if (data.responses?.[0]?.error) {
      throw new Error(`Google Vision API error: ${JSON.stringify(data.responses[0].error)}`)
    }

    const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation
    const textAnnotations = data.responses?.[0]?.textAnnotations || []

    const fullText = fullTextAnnotation?.text || ''
    const detections: TextDetection[] = textAnnotations.slice(1).map((annotation: any) => {
      const vertices = annotation.boundingPoly?.vertices || []
      const minX = Math.min(...vertices.map((v: any) => v.x || 0))
      const minY = Math.min(...vertices.map((v: any) => v.y || 0))
      const maxX = Math.max(...vertices.map((v: any) => v.x || 0))
      const maxY = Math.max(...vertices.map((v: any) => v.y || 0))

      return {
        text: annotation.description || '',
        confidence: annotation.confidence || 0.9,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      }
    })

    // Calculate average confidence
    const avgConfidence =
      detections.length > 0
        ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
        : 0.9

    return {
      fullText,
      detections,
      confidence: avgConfidence,
    }
  }
}

