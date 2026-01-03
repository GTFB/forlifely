import type { Env } from '@/shared/types'
import type { EsnadUser, EsnadUserJournalActions, NewEsnadUserJournal } from '@/shared/types/esnad'
import { JournalsRepository } from '@/shared/repositories/journals.repository'

type MinimalUser = Pick<EsnadUser, 'id' | 'uuid' | 'email' | 'humanAid' | 'dataIn'>

export const logUserJournalEvent = async (
  env: Env,
  action: EsnadUserJournalActions,
  user: MinimalUser,
  extraDetails?: Record<string, unknown>,
): Promise<void> => {
  const journalsRepository = JournalsRepository.getInstance()

  const userId =
    typeof user.id === 'string'
      ? Number(user.id)
      : typeof user.id === 'number'
      ? user.id
      : undefined

  // Use raw log() to ensure created_at/updated_at are always set (some tables have no defaults)
  await journalsRepository.log({
    context: 'user-journal',
    step: action,
    status: 'info',
    message: action,
    payload: {
      user: {
        uuid: user.uuid,
        email: user.email,
        humanAid: user.humanAid ?? null,
      },
      ...(extraDetails || {}),
    },
    userId: typeof userId === 'number' && !Number.isNaN(userId) ? userId : null,
  })
}


