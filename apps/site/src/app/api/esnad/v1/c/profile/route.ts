import { NextResponse } from 'next/server'
import { withRoleGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { MeRepository } from '@/shared/repositories/me.repository'
import { HumanRepository } from '@/shared/repositories/human.repository'
import { FileStorageService } from '@/shared/services/file-storage.service'
import { createDb } from '@/shared/repositories/utils'
import { schema } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import type { UpdateProfileKycRequest, ClientDataIn, KycDocumentRef } from '@/shared/types/esnad'

const handlePut = async (context: AuthenticatedRequestContext): Promise<Response> => {
  const { request, user } = context

  try {
    const body = (await request.json()) as UpdateProfileKycRequest

    if (!body.kycDocuments || !Array.isArray(body.kycDocuments)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'kycDocuments must be an array',
        },
        { status: 400 }
      )
    }

    // Get human profile from user first (needed for ownership check)
    let human = user.human
    if (!human) {
      const meRepository = MeRepository.getInstance()
      const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id), { includeHuman: true })
      human = userWithRoles?.human
    }

    if (!human) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Human profile not found',
        },
        { status: 404 }
      )
    }

    const userHaid = human.haid

    // Validate kycDocuments structure and check ownership
    const fileStorageService = FileStorageService.getInstance()
    
    for (const doc of body.kycDocuments) {
      if (!doc.mediaUuid || !doc.type) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Each document must have mediaUuid and type',
          },
          { status: 400 }
        )
      }

      if (!['passport_main', 'passport_registration', 'selfie', 'other'].includes(doc.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: `Invalid document type: ${doc.type}`,
          },
          { status: 400 }
        )
      }

      // Verify that the file belongs to the current user
      try {
        const mediaMetadata = await fileStorageService.getMediaMetadata(doc.mediaUuid)
        
        if (!mediaMetadata) {
          return NextResponse.json(
            {
              success: false,
              error: 'NOT_FOUND',
              message: `File with UUID ${doc.mediaUuid} not found`,
            },
            { status: 404 }
          )
        }

        // Check ownership: uploaderAid must match current user's haid
        if (mediaMetadata.uploaderAid !== userHaid) {
          return NextResponse.json(
            {
              success: false,
              error: 'FORBIDDEN',
              message: `File with UUID ${doc.mediaUuid} does not belong to you`,
            },
            { status: 403 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: `Failed to verify file ownership for UUID ${doc.mediaUuid}`,
          },
          { status: 400 }
        )
      }

      // Ensure uploadedAt is present, set to current time if not provided
      if (!doc.uploadedAt) {
        doc.uploadedAt = new Date().toISOString()
      }
    }

    // human is already loaded above

    // Parse current dataIn
    const currentDataIn: ClientDataIn =
      typeof human.dataIn === 'string'
        ? (JSON.parse(human.dataIn) as ClientDataIn)
        : (human.dataIn as ClientDataIn) || {}

    // Update dataIn with new kycDocuments
    // Merge with existing documents if needed, or replace entirely
    const updatedDataIn: ClientDataIn = {
      ...currentDataIn,
      kycDocuments: body.kycDocuments,
    }

    // If documents were added and status is not already pending/verified/rejected, set to pending
    const hasDocuments = body.kycDocuments.length > 0
    const currentStatus = currentDataIn.kycStatus || 'not_started'
    
    if (hasDocuments && currentStatus === 'not_started') {
      updatedDataIn.kycStatus = 'pending'
    }

    // Update human profile
    const humanRepository = HumanRepository.getInstance()
    const updatedHuman = await humanRepository.update(human.uuid, {
      dataIn: updatedDataIn as any,
    })

    // If statusName needs to be updated to PENDING
    if (hasDocuments && human.statusName !== 'PENDING' && currentStatus === 'not_started') {
      const db = createDb()
      await db
        .update(schema.humans)
        .set({ statusName: 'PENDING' })
        .where(eq(schema.humans.uuid, human.uuid))
    }

    // Parse updated dataIn for response
    const responseDataIn =
      typeof updatedHuman.dataIn === 'string'
        ? (JSON.parse(updatedHuman.dataIn) as ClientDataIn)
        : (updatedHuman.dataIn as ClientDataIn) || {}

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          name: updatedHuman.fullName || user.email,
          kycStatus: responseDataIn.kycStatus || 'not_started',
          kycDocuments: (responseDataIn.kycDocuments || []) as KycDocumentRef[],
          statusName: updatedHuman.statusName,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update profile error:', error)
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

export const PUT = withRoleGuard(handlePut, ['client'])
