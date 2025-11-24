import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import { Goal } from '../schema/types'
import { generateAid } from '../generate-aid'
import {
  CollectionGoalDataIn,
  CollectionGoalPriority,
  CollectionGoalType,
  CollectionStage,
  EsnadFinance,
  EsnadGoal,
  NewEsnadGoal,
} from '../types/esnad-finance'
import { parseJson } from './utils'

export class GoalsRepository extends BaseRepository<Goal> {
  constructor() {
    super(schema.goals)
  }

  public static getInstance(): GoalsRepository {
    return new GoalsRepository()
  }

  protected async beforeCreate(data: Partial<NewEsnadGoal>): Promise<void> {
    if (!data.gaid) {
      data.gaid = generateAid('g')
    }
    if (!data.fullGaid) {
      data.fullGaid = data.gaid
    }
    if (typeof data.isPublic === 'undefined') {
      data.isPublic = 1
    }
    if (!data.statusName) {
      data.statusName = 'TODO'
    }
  }

  protected async beforeUpdate(_: string, data: Partial<NewEsnadGoal>): Promise<void> {
    return
  }

  public async createCollectionGoalFromFinance(
    finance: EsnadFinance,
    data: CollectionGoalDataIn
  ): Promise<EsnadGoal> {
    const financeDataIn = parseJson<CollectionGoalDataIn | null>(finance.dataIn, null)

    const overdueDays = data.overdueDays
    let goalType: CollectionGoalType = 'CLIENT_CALL'
    let stage: CollectionStage = 'CLIENT_CALL'
    let priority: CollectionGoalPriority = 'MEDIUM'
    let instructions = `Связаться с клиентом по просроченному платежу. Просрочка: ${overdueDays} дней.`

    if (overdueDays > 3 && overdueDays <= 5) {
      goalType = 'GUARANTOR_CALL'
      stage = 'GUARANTOR_CALL'
      priority = 'HIGH'
      instructions = `Связаться с поручителем по просроченному платежу. Просрочка: ${overdueDays} дней.`
    } else if (overdueDays > 5 && overdueDays <= 10) {
      goalType = 'FIELD_VISIT'
      stage = 'FIELD_VISIT'
      priority = 'HIGH'
      instructions = `Организовать выезд службы безопасности. Просрочка: ${overdueDays} дней.`
    } else if (overdueDays > 10) {
      goalType = 'LEGAL_NOTICE'
      stage = 'SECURITY_ESCALATION'
      priority = 'CRITICAL'
      instructions =
        `Критическая просрочка. Требуется эскалация и подготовка юридических документов. Просрочка: ${overdueDays} дней.`
    }

    const goalDataIn: CollectionGoalDataIn = {
      type: data.type || goalType,
      stage: data.stage || stage,
      priority: data.priority || priority,
      dealAid: data.dealAid,
      financeFaid: finance.faid,
      clientAid: data.clientAid ?? financeDataIn?.clientAid ?? null,
      overdueDays,
      assigneeGroup: data.assigneeGroup || 'COLLECTION',
      deadline: data.deadline,
      autoCreated: true,
      relatedHumanAid: data.relatedHumanAid,
      instructions: data.instructions || instructions,
    }

    const title = `[Взыскание] ${
      goalDataIn.type === 'CLIENT_CALL'
        ? 'Звонок клиенту'
        : goalDataIn.type === 'GUARANTOR_CALL'
          ? 'Звонок поручителю'
          : goalDataIn.type === 'FIELD_VISIT'
            ? 'Выезд СБ'
            : 'Юридическое уведомление'
    } по сделке ${goalDataIn.dealAid}. Просрочка: ${overdueDays} дней`

    const newGoal: NewEsnadGoal = {
      uuid: crypto.randomUUID(),
      gaid: generateAid('g'),
      fullGaid: generateAid('g'),
      title,
      cycle: 'ONCE',
      type: 'COLLECTION',
      statusName: 'TODO',
      isPublic: 1,
      order: '0',
      dataIn: goalDataIn,
    }

    const createdGoal = (await this.create(newGoal)) as EsnadGoal

    return createdGoal
  }
}

