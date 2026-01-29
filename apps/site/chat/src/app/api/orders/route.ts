/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { generateAid } from '@/shared/generate-aid'
import { sql } from 'drizzle-orm'
import { sendOrderNotification } from '@/lib/telegram'

interface OrderItem {
  productId: string
  paid: string
  title: string
  price: number
  quantity: number
  image?: string
}

interface CreateOrderRequest {
  name: string
  phone: string
  email?: string
  address: string
  comment?: string
  paymentMethod: string
  items: OrderItem[]
  total: number
  tax: number
  shipping: number
}

/**
 * POST /api/orders
 * Creates a new order (deal) with associated human and deal products
 */
export async function POST(request: Request) {
  const env = buildRequestEnv()

  try {
    const body: CreateOrderRequest = await request.json()
    let { name, phone, email, address, comment, paymentMethod, items, total, tax, shipping } = body

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    // Recalculate shipping if not provided or if we need to verify it
    if (shipping === undefined || shipping === null || shipping === 0) {
      const { SettingsRepository } = await import('@/shared/repositories')
      const settingsRepo = SettingsRepository.getInstance(env.DB)
      const { freeShippingThreshold, shippingCost } = await settingsRepo.getShippingSettings()
      
      shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost
    }
    
    // Recalculate total with correct shipping
    total = subtotal + shipping

    // Validation
    if (!name || !phone || !address || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, phone, address, items' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Find or create human by phone/email
    // NOTE: data_in is stored as TEXT in the database, so we need to cast it to JSONB before using ->>
    const humanResult = await env.DB.execute(sql`
      SELECT * FROM humans 
      WHERE (
        (data_in IS NOT NULL AND data_in::jsonb->>'phone' = ${phone})
        OR email = ${email || ''}
      )
      AND deleted_at IS NULL
      LIMIT 1
    `);
    
    let human = humanResult[0] as {
      id: number
      uuid: string
      haid: string
      full_name: string
      email: string | null
      data_in: any
    } | undefined;

    let humanAid: string

    if (!human) {
      // Create new human
      const humanUuid = crypto.randomUUID()
      humanAid = generateAid('h')
      const dataIn = JSON.stringify({
        phone,
        address,
      })

      const result = await env.DB.execute(sql`
        INSERT INTO humans (
          uuid, haid, full_name, email, data_in, 
          created_at, updated_at
        ) 
        VALUES (${humanUuid}, ${humanAid}, ${name}, ${email || null}, ${dataIn}, 
          NOW(), 
          NOW()
        ) RETURNING id
      `);

      // Get created human
      const createdHumanResult = await env.DB.execute(sql`
        SELECT * FROM humans WHERE id = ${result[0].id}
      `);
      
      const createdHuman = createdHumanResult[0] as unknown as typeof human;

      if (!createdHuman) {
        throw new Error('Failed to create human')
      }

      human = createdHuman as typeof human;
      humanAid = human!.haid
    } else {
      // Update existing human if needed
      humanAid = human!.haid
      let dataIn = typeof human!.data_in === 'string' ? JSON.parse(human!.data_in) : (human!.data_in || {})
      
      // Update phone and address if provided
      if (phone) dataIn.phone = phone
      if (address) dataIn.address = address
      
      const jsonDataIn = JSON.stringify(dataIn);

      if (email && !human.email) {
        // Update email if not set
        await env.DB.execute(sql`
          UPDATE humans 
          SET email = ${email}, data_in = ${jsonDataIn}, updated_at = NOW()
          WHERE id = ${human.id}
        `);
      } else if (JSON.stringify(dataIn) !== JSON.stringify(typeof human.data_in === 'string' ? JSON.parse(human.data_in) : (human.data_in || {}))) {
        // Update data_in if changed
        await env.DB.execute(sql`
          UPDATE humans 
          SET data_in = ${jsonDataIn}, updated_at = NOW()
          WHERE id = ${human.id}
        `);
      }
    }

    // Create deal
    const dealUuid = crypto.randomUUID()
    const daid = generateAid('d')
    const fullDaid = `${daid}`
    
    const dealTitle = `Заказ от ${name}`
    // Store monetary values in cents (integer) for consistency
    const dealDataIn = JSON.stringify({
      phone,
      email: email || null,
      address,
      comment: comment || null,
      paymentMethod,
      total: Math.round(total * 100),
      tax: Math.round(tax * 100),
      shipping: Math.round(shipping * 100),
    })

    const dealResult = await env.DB.execute(sql`
      INSERT INTO deals (
        uuid, daid, full_daid, client_aid, title, status_name, data_in,
        created_at, updated_at
      )
      VALUES (${dealUuid}, ${daid}, ${fullDaid}, ${humanAid}, ${dealTitle}, 'new', ${dealDataIn},
        NOW(),
        NOW()
      ) RETURNING id
    `);

    const dealId = dealResult[0]?.id as number | undefined
    if (!dealId) {
      throw new Error('Failed to create deal')
    }

    // Create deal products
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const productUuid = crypto.randomUUID()
      const fullPaid = `${item.paid}`
      
      // Store price in cents for each item
      const productDataIn = JSON.stringify({
        title: item.title,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
        image: item.image || null,
      })

      await env.DB.execute(sql`
        INSERT INTO deal_products (
          uuid, full_daid, full_paid, quantity, status_name, "order", data_in,
          created_at, updated_at
        )
        VALUES (${productUuid}, ${fullDaid}, ${fullPaid}, ${item.quantity}, 'new', ${100 + i}, ${productDataIn},
          NOW(),
          NOW()
        )
      `);
    }

    // Send Telegram notification (non-blocking)
    sendOrderNotification(env, {
      name,
      phone,
      email: email || undefined,
      address,
      comment: comment || undefined,
      paymentMethod,
      items: items.map(item => ({
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      shipping,
      total,
      dealId: dealId.toString(),
      fullDaid,
    }).then((result) => {
      if (result.success) {
        console.log('Telegram notification sent successfully')
      } else {
        console.error('Failed to send Telegram notification:', result.error)
      }
    }).catch((error) => {
      // Log error but don't fail the request
      console.error('Error sending Telegram notification:', error)
    })

    return new Response(
      JSON.stringify({
        success: true,
        dealId,
        dealUuid,
        daid,
        fullDaid,
        humanAid,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return new Response(
      JSON.stringify({
        error: `Ошибка при создании заказа`,
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
