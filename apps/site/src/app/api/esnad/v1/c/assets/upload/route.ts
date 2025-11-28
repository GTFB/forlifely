import { NextResponse } from 'next/server'
import { withRoleGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { FileStorageService } from '@/shared/services/file-storage.service'
import { MeRepository } from '@/shared/repositories/me.repository'
import type { UploadAssetResponse } from '@/shared/types/esnad'

const handlePost = async (context: AuthenticatedRequestContext): Promise<Response> => {
  const { request, user } = context

  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'File is required',
        },
        { status: 400 }
      )
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'File size exceeds maximum allowed size (10MB)',
        },
        { status: 400 }
      )
    }

    // Get humanAid from user
    // user already contains human from withRoleGuard, but ensure it's loaded
    let human = user.human
    if (!human) {
      const meRepository = MeRepository.getInstance()
      const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id), { includeHuman: true })
      human = userWithRoles?.human
    }

    if (!human?.haid) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Human profile not found',
        },
        { status: 404 }
      )
    }

    const uploaderAid = human.haid

    // Generate unique filename with UUID
    const fileExtension = file.name.split('.').pop() || ''
    const uuid = crypto.randomUUID()
    const filename = `${uuid}.${fileExtension}`

    // Upload file using FileStorageService
    const fileStorageService = FileStorageService.getInstance()
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })
    const createdMedia = await fileStorageService.uploadFile(blob, filename, uploaderAid)

    // Build response - URL format: /api/esnad/v1/c/assets/uuid-filename.ext
    const response: UploadAssetResponse = {
      success: true,
      asset: {
        uuid: createdMedia.uuid,
        url: `/api/esnad/v1/c/assets/${createdMedia.uuid}-${filename}`,
        mimeType: createdMedia.mimeType || file.type,
        fileName: createdMedia.fileName || filename,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
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

export const POST = withRoleGuard(handlePost, ['client'])










