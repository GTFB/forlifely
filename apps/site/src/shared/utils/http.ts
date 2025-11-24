import { EsnadJournal } from "../types/esnad";
import { DbFilters, DbOrders, DbPagination } from "../types/shared";
import { MeRepository } from "../repositories/me.repository";


export const parseQueryParams = (url: URL): { filters: DbFilters; orders: DbOrders; pagination: DbPagination } => {
    const filters: DbFilters = { conditions: [] }
    const orders: DbOrders = { orders: [] }
    const pagination: DbPagination = {}
  
    // Parse pagination
    const page = url.searchParams.get('page')
    const limit = url.searchParams.get('limit')
    if (page) pagination.page = parseInt(page, 10)
    if (limit) pagination.limit = parseInt(limit, 10)
  
    // Parse search filter
    const search = url.searchParams.get('search')
    if (search) {
      filters.conditions?.push({
        field: 'email',
        operator: 'like',
        values: [`%${search}%`],
      })
    }
  
    // Parse isActive filter
    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      filters.conditions?.push({
        field: 'isActive',
        operator: 'eq',
        values: [isActive === 'true'],
      })
    }
  
    // Parse orders (example: ?orderBy=createdAt&orderDirection=desc)
    const orderBy = url.searchParams.get('orderBy')
    const orderDirection = url.searchParams.get('orderDirection') as 'asc' | 'desc' | null
    if (orderBy && orderDirection) {
      orders.orders?.push({
        field: orderBy,
        direction: orderDirection,
      })
    } else {
      // Default order by createdAt desc
      orders.orders?.push({
        field: 'createdAt',
        direction: 'desc',
      })
    }
  
    // Always exclude soft-deleted records
    filters.conditions?.push({
      field: 'deletedAt',
      operator: 'isNull',
      values: [],
    })
  
    return { filters, orders, pagination }
  }

export const parseJournals = async (journals: EsnadJournal[]): Promise<EsnadJournal[]> => {
  // Map action types to readable names
  const actionNames: Record<string, string> = {
    'USER_JOURNAL_LOGIN': 'Вход в систему',
    'USER_JOURNAL_LOGOUT': 'Выход из системы',
    'USER_JOURNAL_REGISTRATION': 'Регистрация',
    'USER_JOURNAL_EMAIL_VERIFICATION': 'Подтверждение email',
    'USER_JOURNAL_PASSWORD_RESET_REQUEST': 'Запрос сброса пароля',
    'USER_JOURNAL_PASSWORD_RESET_CONFIRM': 'Подтверждение сброса пароля',
    'USER_JOURNAL_PASSWORD_RESET': 'Сброс пароля',
    'LOAN_APPLICATION_SNAPSHOT': 'Заявка на рассрочку',
    'DEAL_STATUS_CHANGE': 'Изменение статуса',
    'DEAL_APPROVED': 'Одобрение',
    'DEAL_REJECTED': 'Отказ',
    'DEAL_CANCELLED': 'Отмена',
    'INVESTOR_REGISTERED': 'Новый инвестор',
    'PAYMENT_RECEIVED': 'Получен платеж',
  }

  const meRepository = MeRepository.getInstance()

  // Process journals with async operations
  const processedJournals = await Promise.all(
    journals.map(async (journal) => {
      let updatedJournal = { ...journal }
      const originalAction = journal.action

      // Transform action to readable name
      if (journal.action && actionNames[journal.action]) {
        updatedJournal = {
          ...updatedJournal,
          action: actionNames[journal.action],
        }
      }

      // For USER_JOURNAL_LOGIN, enrich description with user info and roles
      if (originalAction === 'USER_JOURNAL_LOGIN') {
        try {
          const rawDetails =
            typeof journal.details === 'string'
              ? (JSON.parse(journal.details) as Record<string, unknown>)
              : (journal.details as Record<string, unknown> | undefined)

          const userDetails = rawDetails?.user as
            | {
                uuid?: string
                email?: string
                humanAid?: string | null
              }
            | undefined

          if (userDetails?.uuid) {
            const userWithRoles = await meRepository.findByUuidWithRoles(userDetails.uuid, {
              includeHuman: true,
            })

            if (userWithRoles) {
              const userName = userWithRoles.human?.fullName || userDetails.email || 'Неизвестный пользователь'
              const roles = userWithRoles.roles || []
              const roleNames = roles.length > 0 
                ? roles.map((role) => role.title || role.name).filter(Boolean).join(', ')
                : 'Без ролей'

              const description = `${userName} (${roleNames})`

              // Add description and originalAction to details
              const enrichedDetails = {
                ...rawDetails,
                description,
                originalAction,
              }

              updatedJournal = {
                ...updatedJournal,
                details: enrichedDetails,
              }
            }
          }
        } catch (error) {
          console.error('Failed to enrich journal description:', error)
          // Continue with original journal if enrichment fails
        }
      }

      return updatedJournal
    })
  )

  return processedJournals
}