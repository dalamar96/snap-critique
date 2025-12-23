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

                // Auto-Unlock Analysis if redirected there
                if (next.startsWith('/analysis/')) {
                    const submissionId = next.split('/').pop()
                    if (submissionId) {
                        try {
                            // Check current credits
                            const { data: profile } = await adminSupabase
                                .from('profiles')
                                .select('credits_balance')
                                .eq('id', user.id)
                                .single()

                            if (profile && profile.credits_balance > 0) {
                                // Check if not already unlocked
                                const { data: analysis } = await adminSupabase
                                    .from('analyses')
                                    .select('is_unlocked')
                                    .eq('submission_id', submissionId)
                                    .single()

                                if (analysis && !analysis.is_unlocked) {
                                    // Perform Transaction: Deduct Credit & Unlock
                                    // Note: Ideally this should be an RPC or transaction, but parallel requests are unlikely here.
                                    await adminSupabase
                                        .from('profiles')
                                        .update({ credits_balance: profile.credits_balance - 1 })
                                        .eq('id', user.id)

                                    await adminSupabase
                                        .from('analyses')
                                        .update({ is_unlocked: true })
                                        .eq('submission_id', submissionId)

                                    console.log(`[Auth Callback] Auto-unlocked submission ${submissionId} for user ${user.id}`)
                                }
                            }
                        } catch (unlockError) {
                            console.error('Auto-unlock failed:', unlockError)
                        }
                    }
                }
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
