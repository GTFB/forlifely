/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { parseJson } from '@/shared/repositories/utils'
import { sql } from 'drizzle-orm'

/**
 * GET /api/promocodes?code=WELCOME10
 * Проверяет промокод и возвращает информацию о скидке
 */
export async function GET(request: Request) {
  const env = buildRequestEnv()
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.toUpperCase().trim()

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Промокод не указан' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    if (!env.DB) {
      throw new Error('Database binding is not configured')
    }

    // Ищем промокод в базе данных
    // Получаем все промокоды и фильтруем в коде
    let result: any[] = []
    try {
      // Пробуем разные варианты запроса
      try {
        result = await env.DB.execute(
          sql`SELECT * FROM "outreaches" WHERE "strategy_type" = 'promocode' AND "deleted_at" IS NULL`
        ) as unknown as any[]
      } catch (e1) {
        try {
          result = await env.DB.execute(
            sql`SELECT * FROM "outreaches" WHERE "strategyType" = 'promocode' AND "deletedAt" IS NULL`
          ) as unknown as any[]
        } catch (e2) {
          // Если оба варианта не работают, получаем все записи и фильтруем
          const allResult = await env.DB.execute(
            sql`SELECT * FROM "outreaches" WHERE "deleted_at" IS NULL OR "deletedAt" IS NULL`
          ) as unknown as any[]
          result = allResult.filter((item: any) => {
            const strategyType = item.strategy_type || item.strategyType
            return strategyType === 'promocode'
          })
        }
      }
    } catch (queryError) {
      console.error('Error executing promocode query:', queryError)
      throw queryError
    }

    // Фильтруем промокоды по коду в data_in
    const promocode = result.find((item: any) => {
      // data_in может быть в snake_case или camelCase
      const dataInRaw = item.data_in || item.dataIn
      if (!dataInRaw) return false
      
      try {
        // dataInRaw может быть строкой JSON, нужно явно парсить
        // Может быть двойная сериализация (JSON внутри JSON строки)
        let dataIn: any = {}
        if (typeof dataInRaw === 'string') {
          // Пробуем распарсить JSON строку
          try {
            let parsed = JSON.parse(dataInRaw)
            // Если результат парсинга - снова строка, парсим еще раз (двойная сериализация)
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed)
              } catch {
                // Если второй парсинг не удался, используем результат первого
              }
            }
            // Проверяем, что получили объект, а не строку
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              dataIn = parsed
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Parsed dataInRaw is not an object:', typeof parsed, parsed)
              }
              dataIn = {}
            }
          } catch (parseError) {
            // Если JSON.parse не сработал, dataIn остается пустым объектом
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to parse dataInRaw as JSON:', parseError)
              console.error('dataInRaw value:', dataInRaw)
            }
            dataIn = {}
          }
        } else if (typeof dataInRaw === 'object' && dataInRaw !== null && !Array.isArray(dataInRaw)) {
          dataIn = dataInRaw
        } else {
          // Для других типов пробуем parseJson
          const parsed = parseJson<{ code?: string }>(dataInRaw, {})
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            dataIn = parsed
          } else {
            dataIn = {}
          }
        }
        
        const itemCode = dataIn?.code?.toUpperCase()?.trim()
        const searchCode = code.toUpperCase().trim()
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Promocode search:', {
            itemCode,
            searchCode,
            match: itemCode === searchCode,
            dataInRawType: typeof dataInRaw,
            dataInRawLength: typeof dataInRaw === 'string' ? dataInRaw.length : 'N/A',
            dataInRawPreview: typeof dataInRaw === 'string' ? dataInRaw.substring(0, 150) : dataInRaw,
            dataInType: typeof dataIn,
            dataInKeys: typeof dataIn === 'object' && dataIn !== null ? Object.keys(dataIn) : 'N/A',
            dataIn: dataIn
          })
        }
        
        return itemCode === searchCode
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing data_in:', error, dataInRaw)
        }
        return false
      }
    })

    if (!promocode) {
      return new Response(
        JSON.stringify({ error: 'Промокод не существует' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const dataInRaw = promocode.data_in || promocode.dataIn
    let dataIn: {
      code: string
      discountType: 'percent' | 'fixed'
      discountValue: number
      quantity: number
      used: number
      description?: string
    } = { code: '', discountType: 'percent', discountValue: 0, quantity: 0, used: 0 }
    
    if (typeof dataInRaw === 'string') {
      try {
        let parsed = JSON.parse(dataInRaw)
        // Если результат парсинга - снова строка, парсим еще раз (двойная сериализация)
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed)
          } catch {
            // Если второй парсинг не удался, используем результат первого
          }
        }
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          dataIn = parsed as typeof dataIn
        }
      } catch {
        dataIn = parseJson(dataInRaw, dataIn)
      }
    } else if (typeof dataInRaw === 'object' && dataInRaw !== null) {
      dataIn = dataInRaw as typeof dataIn
    } else {
      dataIn = parseJson(dataInRaw, dataIn)
    }

    // Проверяем, не закончился ли промокод
    if (dataIn.used >= dataIn.quantity) {
      return new Response(
        JSON.stringify({ error: 'Промокод закончился' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Парсим title
    let title = ''
    if (promocode.title) {
      try {
        const titleObj = parseJson<{ ru?: string }>(promocode.title, {})
        title = titleObj.ru || ''
      } catch {
        title = typeof promocode.title === 'string' ? promocode.title : ''
      }
    }

    return new Response(
      JSON.stringify({
        id: promocode.id,
        uuid: promocode.uuid,
        oaid: promocode.oaid,
        code: dataIn.code,
        title,
        discountType: dataIn.discountType,
        discountValue: dataIn.discountValue,
        quantity: dataIn.quantity,
        used: dataIn.used,
        available: dataIn.quantity - dataIn.used,
        description: dataIn.description || '',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error checking promocode:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка при проверке промокода',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * POST /api/promocodes/apply
 * Применяет промокод (уменьшает количество использований)
 * Body: { code: string, cartTotal: number }
 */
export async function POST(request: Request) {
  const env = buildRequestEnv()

  try {
    if (!env.DB) {
      throw new Error('Database binding is not configured')
    }

    const body = await request.json() as { code?: string; cartTotal?: number }
    const code = body.code?.toUpperCase().trim()

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Промокод не указан' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Ищем промокод
    // Получаем все промокоды и фильтруем в коде
    let result: any[] = []
    try {
      // Пробуем разные варианты запроса
      try {
        result = await env.DB.execute(
          sql`SELECT * FROM "outreaches" WHERE "strategy_type" = 'promocode' AND "deleted_at" IS NULL`
        ) as unknown as any[]
      } catch (e1) {
        try {
          result = await env.DB.execute(
            sql`SELECT * FROM "outreaches" WHERE "strategyType" = 'promocode' AND "deletedAt" IS NULL`
          ) as unknown as any[]
        } catch (e2) {
          // Если оба варианта не работают, получаем все записи и фильтруем
          const allResult = await env.DB.execute(
            sql`SELECT * FROM "outreaches" WHERE "deleted_at" IS NULL OR "deletedAt" IS NULL`
          ) as unknown as any[]
          result = allResult.filter((item: any) => {
            const strategyType = item.strategy_type || item.strategyType
            return strategyType === 'promocode'
          })
        }
      }
    } catch (queryError) {
      console.error('Error executing promocode query:', queryError)
      throw queryError
    }

    // Фильтруем промокоды по коду в data_in
    const promocode = result.find((item: any) => {
      // data_in может быть в snake_case или camelCase
      const dataInRaw = item.data_in || item.dataIn
      if (!dataInRaw) return false
      
      try {
        // dataInRaw может быть строкой JSON, нужно явно парсить
        let dataIn: any = {}
        if (typeof dataInRaw === 'string') {
          try {
            dataIn = JSON.parse(dataInRaw)
          } catch {
            dataIn = {}
          }
        } else if (typeof dataInRaw === 'object' && dataInRaw !== null) {
          dataIn = dataInRaw
        } else {
          dataIn = parseJson<{ code?: string }>(dataInRaw, {})
        }
        
        const itemCode = dataIn.code?.toUpperCase().trim()
        const searchCode = code.toUpperCase().trim()
        
        return itemCode === searchCode
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing data_in:', error, dataInRaw)
        }
        return false
      }
    })

    if (!promocode) {
      return new Response(
        JSON.stringify({ error: 'Промокод не существует' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const dataInRaw = promocode.data_in || promocode.dataIn
    let dataIn: {
      code: string
      discountType: 'percent' | 'fixed'
      discountValue: number
      quantity: number
      used: number
      description?: string
    } = { code: '', discountType: 'percent', discountValue: 0, quantity: 0, used: 0 }
    
    if (typeof dataInRaw === 'string') {
      try {
        let parsed = JSON.parse(dataInRaw)
        // Если результат парсинга - снова строка, парсим еще раз (двойная сериализация)
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed)
          } catch {
            // Если второй парсинг не удался, используем результат первого
          }
        }
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          dataIn = parsed as typeof dataIn
        }
      } catch {
        dataIn = parseJson(dataInRaw, dataIn)
      }
    } else if (typeof dataInRaw === 'object' && dataInRaw !== null) {
      dataIn = dataInRaw as typeof dataIn
    } else {
      dataIn = parseJson(dataInRaw, dataIn)
    }

    // Проверяем, не закончился ли промокод
    if (dataIn.used >= dataIn.quantity) {
      return new Response(
        JSON.stringify({ error: 'Промокод закончился' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Увеличиваем счетчик использований
    const updatedDataIn = {
      ...dataIn,
      used: dataIn.used + 1,
    }

    // Обновляем промокод в базе данных
    await env.DB.execute(
      sql`UPDATE "outreaches" 
          SET "data_in" = ${JSON.stringify(updatedDataIn)},
              "updated_at" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE "id" = ${promocode.id}`
    )

    // Рассчитываем скидку
    const cartTotal = body.cartTotal || 0
    let discount = 0
    let finalTotal = cartTotal

    if (dataIn.discountType === 'percent') {
      discount = Math.round((cartTotal * dataIn.discountValue) / 100)
      finalTotal = cartTotal - discount
    } else if (dataIn.discountType === 'fixed') {
      discount = dataIn.discountValue
      finalTotal = Math.max(0, cartTotal - discount)
    }

    // Парсим title
    let title = ''
    if (promocode.title) {
      try {
        const titleObj = parseJson<{ ru?: string }>(promocode.title, {})
        title = titleObj.ru || ''
      } catch {
        title = typeof promocode.title === 'string' ? promocode.title : ''
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        code: dataIn.code,
        title,
        discountType: dataIn.discountType,
        discountValue: dataIn.discountValue,
        discount,
        cartTotal,
        finalTotal,
        available: updatedDataIn.quantity - updatedDataIn.used,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error applying promocode:', error)
    return new Response(
      JSON.stringify({ error: 'Ошибка при применении промокода' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

