import type { Env } from '@/shared/types'
import type { EsnadUser, EsnadUserData } from '@/shared/types/esnad'
import { UsersRepository } from '@/shared/repositories/users.repository'
import { sendEmail } from './email.service'

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours
export const EMAIL_RESEND_COOLDOWN_MS = 1000 * 60 // 1 minute

export class EmailVerificationError extends Error {
  public readonly code: 'ALREADY_VERIFIED' | 'RESEND_TOO_SOON' | 'INVALID_TOKEN'
  public readonly nextAttemptAt?: string

  constructor(
    code: EmailVerificationError['code'],
    message: string,
    options?: { nextAttemptAt?: string },
  ) {
    super(message)
    this.code = code
    this.nextAttemptAt = options?.nextAttemptAt
  }
}

type VerificationMetadata = NonNullable<EsnadUserData['emailVerification']>

const textEncoder = new TextEncoder()

const hashToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(token))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const parseUserData = (user: EsnadUser): EsnadUserData => {
  if (!user.dataIn) {
    return {}
  }

  if (typeof user.dataIn === 'string') {
    try {
      return JSON.parse(user.dataIn) as EsnadUserData
    } catch {
      return {}
    }
  }

  return user.dataIn as EsnadUserData
}

const buildBaseUrl = (env: Env, request?: Request): string => {
  if (env.PUBLIC_SITE_URL) {
    return env.PUBLIC_SITE_URL
  }

  if (request) {
    const url = new URL(request.url)
    return url.origin
  }

  return 'https://esnad.local'
}

const buildVerificationLink = (baseUrl: string, email: string, token: string): string => {
  const url = new URL('/verify-email', baseUrl)
  url.searchParams.set('email', email)
  url.searchParams.set('token', token)
  return url.toString()
}

const getNextAttemptAt = (metadata?: VerificationMetadata): string | null => {
  if (!metadata?.lastSentAt) {
    return null
  }
  return new Date(new Date(metadata.lastSentAt).getTime() + EMAIL_RESEND_COOLDOWN_MS).toISOString()
}

const ensureCooldown = (metadata?: VerificationMetadata) => {
  if (!metadata?.lastSentAt) {
    return
  }

  const lastSent = new Date(metadata.lastSentAt).getTime()
  if (Date.now() - lastSent < EMAIL_RESEND_COOLDOWN_MS) {
    throw new EmailVerificationError('RESEND_TOO_SOON', 'Verification email was sent recently', {
      nextAttemptAt: new Date(lastSent + EMAIL_RESEND_COOLDOWN_MS).toISOString(),
    })
  }
}

export const sendVerificationEmail = async (
  env: Env,
  user: EsnadUser,
  options: { request?: Request; force?: boolean } = {},
): Promise<void> => {
  if (user.emailVerifiedAt) {
    throw new EmailVerificationError('ALREADY_VERIFIED', 'Email already verified')
  }

  const usersRepository = UsersRepository.getInstance(env.DB as D1Database)
  const dataIn = parseUserData(user)
  if (!options.force) {
    ensureCooldown(dataIn.emailVerification)
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const hashedToken = await hashToken(token)
  const updatedDataIn: EsnadUserData = {
    ...dataIn,
    emailVerification: {
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString(),
      lastSentAt: new Date().toISOString(),
    },
  }

  await usersRepository.update(user.uuid, {
    dataIn: updatedDataIn,
  })

  const baseUrl = buildBaseUrl(env, options.request)
  const verificationLink = buildVerificationLink(baseUrl, user.email, token)

  await sendEmail(env, {
    to: user.email,
    subject: 'Подтверждение адреса электронной почты',
    html: `
      <p>Здравствуйте!</p>
      <p>Вы зарегистрировались в платформе Esnad. Для продолжения, пожалуйста, подтвердите адрес электронной почты:</p>
      <p><a href="${verificationLink}">Подтвердить email</a></p>
      <p>Если кнопка не работает, скопируйте ссылку и вставьте в браузер:</p>
      <p>${verificationLink}</p>
    `,
    text: `Здравствуйте! Подтвердите email, перейдя по ссылке: ${verificationLink}`,
  })
}

export const verifyEmailToken = async (
  env: Env,
  user: EsnadUser,
  token: string,
): Promise<EsnadUser> => {
  if (user.emailVerifiedAt) {
    throw new EmailVerificationError('ALREADY_VERIFIED', 'Email already verified')
  }

  const usersRepository = UsersRepository.getInstance(env.DB as D1Database)
  const dataIn = parseUserData(user)
  const metadata = dataIn.emailVerification

  if (!metadata?.tokenHash || !metadata.expiresAt) {
    throw new EmailVerificationError('INVALID_TOKEN', 'Verification token not found')
  }

  if (new Date(metadata.expiresAt).getTime() < Date.now()) {
    throw new EmailVerificationError('INVALID_TOKEN', 'Verification token expired')
  }

  const hashedToken = await hashToken(token)
  if (hashedToken !== metadata.tokenHash) {
    throw new EmailVerificationError('INVALID_TOKEN', 'Verification token is invalid')
  }

  const updatedDataIn = {
    ...dataIn,
  }
  delete updatedDataIn.emailVerification

  const updatedUser = await usersRepository.update(user.uuid, {
    emailVerifiedAt: new Date().toISOString(),
    dataIn: updatedDataIn,
  })

  return updatedUser
}

export const getVerificationMetadata = (user: EsnadUser): VerificationMetadata | undefined => {
  const dataIn = parseUserData(user)
  return dataIn.emailVerification
}

export const getNextResendAvailableAt = (user: EsnadUser): string | null => {
  return getNextAttemptAt(getVerificationMetadata(user))
}


