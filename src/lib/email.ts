import { Logger } from '@/lib/logger'

export type SendEmailResult = { ok: true } | { ok: false; error: string }

/**
 * Sends a transactional email through Resend's REST API (no SDK dependency).
 * Requires RESEND_API_KEY and EMAIL_FROM (e.g. "Snap Critique <hello@yourdomain.com>",
 * on a domain verified in Resend). Returns a result instead of throwing so
 * bulk senders can keep going and report per-recipient failures.
 */
export async function sendEmail(params: {
    to: string
    subject: string
    html: string
    text: string
    /** Extra message headers, e.g. List-Unsubscribe. */
    headers?: Record<string, string>
}): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM

    if (!apiKey || !from) {
        return { ok: false, error: 'Email is not configured (set RESEND_API_KEY and EMAIL_FROM).' }
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html, text: params.text, headers: params.headers }),
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            Logger.warn('[Email] Resend rejected message', { status: res.status, body })
            return { ok: false, error: `Email provider error (${res.status})` }
        }
        return { ok: true }
    } catch (e) {
        Logger.warn('[Email] Send failed', { error: String(e) })
        return { ok: false, error: 'Email request failed' }
    }
}
