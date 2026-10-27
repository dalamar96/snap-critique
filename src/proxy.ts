import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { normalizeReferralCode, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from '@/lib/referrals'

export async function proxy(request: NextRequest) {
    const response = await updateSession(request)

    // Remember the referral code from a ?ref= link until signup. First touch
    // wins: an existing cookie is not overwritten by a later link.
    const refCode = normalizeReferralCode(request.nextUrl.searchParams.get('ref'))
    if (refCode && !request.cookies.has(REFERRAL_COOKIE)) {
        response.cookies.set(REFERRAL_COOKIE, refCode, {
            maxAge: REFERRAL_COOKIE_MAX_AGE,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })
    }

    return response
}

// Session refresh only matters where the server reads the user. Public,
// user-independent pages are excluded so they skip the auth round-trip and
// can be served statically.
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|about|privacy|terms|gallery|community|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
