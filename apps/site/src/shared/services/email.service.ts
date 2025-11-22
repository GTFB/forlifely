import type { Env } from '@/shared/types'

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim()

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  const from = env.EMAIL_FROM || env.MAIL_FROM
  const apiKey = env.RESEND_API_KEY || env.SENDGRID_API_KEY

  if (apiKey && from) {
    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text ?? stripHtml(payload.html),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('Email provider responded with error', errorBody)
        throw new Error(`Failed to send email: ${response.status}`)
      }

      return
    } catch (error) {
      console.error('Email sending failed, falling back to console output', error)
    }
  }

  console.info('[email-preview]', {
    to: payload.to,
    subject: payload.subject,
    text: payload.text ?? stripHtml(payload.html),
    html: payload.html,
  })
}


