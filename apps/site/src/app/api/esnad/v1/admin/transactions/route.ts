import { NextResponse } from 'next/server'
import { WalletTransactionRepository } from '@/shared/repositories/wallet-transaction.repository'
import type { DbFilters, DbOrders, DbPagination } from '@/shared/types/shared'
import { withAdminGuard, AuthenticatedRequestContext } from '@/shared/api-guard'

/**
 * GET /api/esnad/v1/admin/transactions
 * Returns all wallet transactions in the system with pagination
 * Sorted by createdAt DESC (newest first) by default
 */
const onRequestGet = async (context: AuthenticatedRequestContext) => {
  const { request } = context
  const url = new URL(request.url)
  
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || ''
  const walletId = url.searchParams.get('walletId') || ''

  try {
    const walletTransactionRepository = WalletTransactionRepository.getInstance()
    
    // Build filters
    const filters: DbFilters = {
      conditions: [],
    }

    // Add status filter if provided
    if (status) {
      filters.conditions!.push({
        field: 'statusName',
        operator: 'eq',
        values: [status],
      })
    }

    // Add wallet filter if provided
    if (walletId) {
      filters.conditions!.push({
        field: 'fullWaid',
        operator: 'like',
        values: [`%${walletId}%`],
      })
    }

    // Add search filter if provided (search by wallet ID or transaction ID)
    if (search) {
      filters.conditions!.push({
        field: 'wcaid',
        operator: 'like',
        values: [`%${search}%`],
      })
    }

    // Default sorting: newest first (createdAt DESC)
    const orders: DbOrders = {
      orders: [
        { field: 'createdAt', direction: 'desc' },
        { field: 'order', direction: 'asc' },
      ],
    }

    const pagination: DbPagination = {
      page,
      limit,
    }

    // Get wallet transactions
    const result = await walletTransactionRepository.getFiltered(
      filters,
      orders,
      pagination
    )

    // Transform wallet transactions to response format
    const transactions = result.docs.map((transaction) => {
      const dataIn = transaction.dataIn && typeof transaction.dataIn === 'object'
        ? transaction.dataIn as any
        : {}

      // transaction.amount хранится в копейках (строка), конвертируем в рубли
      const amountKopecks = transaction.amount ? parseInt(String(transaction.amount), 10) : 0
      const amount = amountKopecks / 100 // Конвертируем копейки в рубли

      return {
        uuid: transaction.uuid,
        wcaid: transaction.wcaid,
        fullWaid: transaction.fullWaid || null,
        targetAid: transaction.targetAid || null,
        statusName: transaction.statusName || 'COMPLETED',
        amount: amount,
        type: dataIn.type || 'UNKNOWN',
        description: dataIn.description || dataIn.comment || '',
        order: transaction.order ? parseFloat(String(transaction.order)) : 0,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }
    })

    return NextResponse.json({
      success: true,
      transactions,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Get transactions error (admin):', error)
    return NextResponse.json(
      { error: 'Failed to get transactions', details: String(error) },
      { status: 500 }
    )
  }
}

export const GET = withAdminGuard(onRequestGet)

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

