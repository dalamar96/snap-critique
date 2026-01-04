import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Failsafe: Ensure profile exists
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const adminSupabase = createAdminClient()
                const { error: profileError } = await adminSupabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,

                        credits_balance: 5
                    }, { onConflict: 'id', ignoreDuplicates: true })

                if (profileError) {
                    console.error('Callback Profile Upsert Error:', profileError)
                }

                // Auto-unlock logic removed to prevent race conditions.
                // Claim and unlock logic is now centralized in /analysis/[id]/page.tsx
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
