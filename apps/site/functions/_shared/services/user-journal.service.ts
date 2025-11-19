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
  const journalsRepository = JournalsRepository.getInstance(env.DB as D1Database)

  const entry: NewEsnadUserJournal = {
    uuid: crypto.randomUUID(),
    action,
    details: {
      user: {
        uuid: user.uuid,
        email: user.email,
        humanAid: user.humanAid ?? null,
      },
      ...extraDetails,
    },
  }

  const userId =
    typeof user.id === 'string'
      ? Number(user.id)
      : typeof user.id === 'number'
      ? user.id
      : undefined

  if (typeof userId === 'number' && !Number.isNaN(userId)) {
    (entry as NewEsnadUserJournal & { userId: number }).userId = userId
  }

  await journalsRepository.create(entry)
}


