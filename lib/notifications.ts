import { createAdminClient } from '@/lib/supabase/admin'

type NotificationInput = {
  userId: string
  title: string
  message: string
  kind?: 'order' | 'payment' | 'return' | 'stock' | 'reward' | 'info'
  link?: string
  email?: string | null
  phone?: string | null
}

/**
 * Always creates an in-app notification. Email/SMS delivery is optional: set
 * NOTIFICATION_WEBHOOK_URL to an automation endpoint (Resend/Twilio/MSG91,
 * n8n, etc.) and the same event is forwarded without coupling checkout to a
 * particular provider.
 */
export async function notifyCustomer(input: NotificationInput) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    kind: input.kind ?? 'info',
    link: input.link ?? null,
  })

  const webhook = process.env.NOTIFICATION_WEBHOOK_URL
  if (!webhook) return
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NOTIFICATION_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Notification providers must never make checkout/status updates fail.
  }
}
