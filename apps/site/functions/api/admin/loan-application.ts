import qs from 'qs'
import type { Env } from '../../_shared/types'
import { DealsRepository } from '../../_shared/repositories/deals.repository'
import type { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from '../../_shared/types/shared'
import type { LoanApplication, LoanApplicationDataIn } from '../../_shared/types/esnad'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url)
        const parsed = qs.parse(url.search, { ignoreQueryPrefix: true })

        let filters: DbFilters | undefined
        if (parsed.filters) {
            try {
                filters = typeof parsed.filters === 'string'
                    ? (JSON.parse(parsed.filters) as DbFilters)
                    : (parsed.filters as DbFilters)
            } catch (error) {
                return new Response(
                    JSON.stringify({
                        error: 'INVALID_FILTERS',
                        message: 'Unable to parse filters parameter',
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } },
                )
            }
        }

        let orders: DbOrders | undefined
        if (parsed.orders) {
            orders = typeof parsed.orders === 'string'
                ? (JSON.parse(parsed.orders) as DbOrders)
                : (parsed.orders as DbOrders)
        }

        const pagination: DbPagination = {
            page: parsed.page ? Number(parsed.page) : undefined,
            limit: parsed.limit ? Number(parsed.limit) : undefined,
        }

        const dealsRepository = new DealsRepository(env.DB)
        const combinedFilters: DbFilters = {
            conditions: [
                ...(filters?.conditions ?? []),
                {
                    field: 'dataIn',
                    operator: 'like',
                    values: ['%"type":"LOAN_APPLICATION"%'],
                },
            ],
        }

        const dealsResult = await dealsRepository.getDeals({
            filters: combinedFilters,
            orders,
            pagination,
        })

        const applications: LoanApplication[] = dealsResult.docs
            .map((deal) => {
                let dataIn: unknown = deal.dataIn

                if (typeof dataIn === 'string') {
                    try {
                        dataIn = JSON.parse(dataIn) as LoanApplicationDataIn
                    } catch {
                        dataIn = null
                    }
                }

                if (!dataIn || (dataIn as LoanApplicationDataIn).type !== 'LOAN_APPLICATION') {
                    return null
                }

                return {
                    ...deal,
                    dataIn,
                } as LoanApplication
            })
            .filter((deal): deal is LoanApplication => deal !== null)

        const response: DbPaginatedResult<LoanApplication> = {
            docs: applications,
            pagination: dealsResult.pagination,
        }

        return new Response(JSON.stringify(response), {
            headers: {
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Failed to load loan applications', error)
        return new Response(
            JSON.stringify({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to load loan applications',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
}

export const onRequestOptions = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}