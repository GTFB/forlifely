/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { generateAid } from '@/shared/generate-aid'
import { sql } from 'drizzle-orm'

async function handlePost(context: AuthenticatedContext): Promise<Response> {
  const { env, request } = context

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string || ''
    const alt = formData.get('alt') as string || ''

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'File must be an image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop() || ''
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    
    // Generate unique filename
    let fileName = `${baseName}.${fileExtension}`
    let counter = 1
    
    // Check if file exists and generate unique name
    while (true) {
      const checkResult = await env.DB.execute(
        sql`SELECT "file_name" FROM "media" WHERE "file_name" = ${fileName} AND "deleted_at" IS NULL LIMIT 1`
      ) as unknown as any[]
      
      if (checkResult.length === 0) {
        break // File name is available
      }
      fileName = `${baseName}-${counter}.${fileExtension}`
      counter++
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // In Cloudflare Workers, we can't write to filesystem directly
    // Instead, we'll store the file using R2 or another storage solution
    // For now, we'll just save the metadata to the database
    // The actual file should be uploaded to R2 or public/images folder via another mechanism
    
    // Save metadata to database
    const uuid = generateAid('m')
    const now = new Date().toISOString()
    
    await env.DB.execute(
      sql`INSERT INTO "media" (
        "uuid", "title", "alt_text", "file_name", "mime_type", 
        "size_bytes", "type", "is_public", "created_at", "updated_at"
      ) VALUES (
        ${uuid}, ${title}, ${alt}, ${fileName}, ${file.type},
        ${buffer.length}, 'image', 1, ${now}, ${now}
      )`
    )

    return new Response(JSON.stringify({ 
      fileName: fileName,
      fullFileName: fileName,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    return new Response(JSON.stringify({ error: 'Failed to upload media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Allow both Admin and Editor roles for media upload
export const POST = withEditorGuard(handlePost)

