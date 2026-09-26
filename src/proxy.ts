import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

// Session refresh only matters where the server reads the user. Public,
// user-independent pages are excluded so they skip the auth round-trip and
// can be served statically.
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|about|privacy|terms|gallery|community|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
