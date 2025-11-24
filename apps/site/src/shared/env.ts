import { db } from './db'
import type { Env } from './types'

export const buildRequestEnv = (): Env => {
  return Object.assign({}, process.env, {
    DB: db,
  }) as Env
}


