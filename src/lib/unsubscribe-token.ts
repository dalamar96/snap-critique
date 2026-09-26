import { createHmac, timingSafeEqual } from 'crypto'

// Unsubscribe links must work without logging in, so they carry a signed
// token instead: base64url(userId) + "." + HMAC-SHA256(userId). The signature
// means a link can't be forged for someone else's account. No expiry on
// purpose — an old email's unsubscribe link should keep working.

function getSecret(): string {
    const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) throw new Error('UNSUBSCRIBE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set')
    return secret
}

function sign(payload: string): string {
    return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function createUnsubscribeToken(userId: string): string {
    const payload = Buffer.from(userId, 'utf8').toString('base64url')
    return `${payload}.${sign(payload)}`
}

/** Returns the user id if the token is authentic, otherwise null. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
    if (!token) return null
    const [payload, signature, ...rest] = token.split('.')
    if (!payload || !signature || rest.length > 0) return null

    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(signature)
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

    const userId = Buffer.from(payload, 'base64url').toString('utf8')
    return userId || null
}

export function buildUnsubscribeUrl(siteUrl: string, userId: string): string {
    return `${siteUrl.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(userId))}`
}
