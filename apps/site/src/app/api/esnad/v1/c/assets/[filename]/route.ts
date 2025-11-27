import { NextResponse } from 'next/server'
import { FileStorageService } from '@/shared/services/file-storage.service'
import { getSession } from '@/shared/session'
import { MeRepository } from '@/shared/repositories/me.repository'
import { buildRequestEnv } from '@/shared/env'

const handleGet = async (
  request: Request,
  props: { params: Promise<{ filename: string }> }
): Promise<Response> => {
  try {
    const { filename } = await props.params

    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Filename is required',
        },
        { status: 400 }
      )
    }

    // Extract UUID from filename (format: uuid-extension or uuid)
    // Filename can be: "uuid.ext" or just "uuid"
    const uuidMatch = filename.match(/^([a-f0-9-]{36})(?:-.*)?(?:\.\w+)?$/i)
    
    if (!uuidMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid filename format',
        },
        { status: 400 }
      )
    }

    const uuid = uuidMatch[1]

    // Get file content using FileStorageService
    const fileStorageService = FileStorageService.getInstance()
    
    try {
      const mediaMetadata = await fileStorageService.getMediaMetadata(uuid)
      
      if (!mediaMetadata) {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_FOUND',
            message: 'File not found',
          },
          { status: 404 }
        )
      }

      // Check if file is public or if user has access
      // If file is private (isPublic === 0), verify ownership
      if (mediaMetadata.isPublic === 0 && mediaMetadata.uploaderAid) {
        // Try to get session to verify ownership
        const env = buildRequestEnv()
        if (env.AUTH_SECRET) {
          const session = await getSession(request, env.AUTH_SECRET)
          if (session?.id) {
            const meRepository = MeRepository.getInstance()
            const userWithRoles = await meRepository.findByIdWithRoles(Number(session.id), { includeHuman: true })
            
            // Check if file belongs to current user
            if (!userWithRoles?.human?.haid || userWithRoles.human.haid !== mediaMetadata.uploaderAid) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'FORBIDDEN',
                  message: 'Access denied: File does not belong to you',
                },
                { status: 403 }
              )
            }
          } else {
            // No session but file is private - deny access
            return NextResponse.json(
              {
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authentication required to access this file',
              },
              { status: 401 }
            )
          }
        }
      }

      const fileContent = await fileStorageService.getFileContent(uuid)
      const mimeType = mediaMetadata.mimeType || 'application/octet-stream'

      // Return file with appropriate headers
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${mediaMetadata.fileName || filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Media not found') {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_FOUND',
            message: 'File not found',
          },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('File serve error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message,
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ filename: string }> }
): Promise<Response> {
  return handleGet(request, props)
}

