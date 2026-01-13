import type { Env } from '@/shared/types'
import type { altrpUser, altrpUserJournalActions, NewaltrpUserJournal } from '@/shared/types/altrp'
import { JournalsRepository } from '@/shared/repositories/journals.repository'

type MinimalUser = Pick<altrpUser, 'id' | 'uuid' | 'email' | 'humanAid' | 'dataIn'>

export const logUserJournalEvent = async (
  env: Env,
  action: altrpUserJournalActions,
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


