'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Invalid credentials')
    }

    if (data.user) {
        const adminSupabase = createAdminClient()
        // Ensure profile exists. If not, create with 5 credits. If exists, do nothing.
        await adminSupabase.from('profiles').upsert({
            id: data.user.id,
            email: email,

            credits_balance: 5
        }, { onConflict: 'id', ignoreDuplicates: true })
    }

    const next = formData.get('next') as string
    const redirectUrl = next && next.startsWith('/') ? next : '/dashboard'

    revalidatePath('/', 'layout')
    redirect(redirectUrl)
}

import { headers } from 'next/headers'

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = formData.get('next') as string

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'https://www.snapcritique.com';

    let emailRedirectTo = `${siteUrl}/auth/callback`

    if (emailRedirectTo && next) {
        emailRedirectTo += `?next=${encodeURIComponent(next)}`
    }
    console.log("Site URL for redirect resolved to: ", emailRedirectTo);
    // 1. Sign Up Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: emailRedirectTo,
        }
    })

    if (authError) {
        redirect('/login?error=' + authError.message + (next ? `&next=${encodeURIComponent(next)}` : ''))
    }

    if (authData.user) {
        // 2. Create Profile (Manually ensuring it exists with 5 credits)
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: email,
                created_at: new Date().toISOString(),
                credits_balance: 5
            }) // Default behavior is UPSERT (merge/overwrite), which correctly overrides any 0-credit trigger.

        if (profileError) {
            console.error('Profile creation failed:', profileError)
        }

        // 3. Link Guest Submission if 'next' param points to an analysis
        if (next && next.startsWith('/analysis/')) {
            // Extract ID effectively, ignoring query params like ?claim=true
            const path = next.split('?')[0] // /analysis/[id]
            const submissionId = path.split('/').pop()
            if (submissionId) {
                const { error: linkError } = await adminSupabase
                    .from('submissions')
                    .update({ user_id: authData.user.id })
                    .eq('id', submissionId)

                if (linkError) {
                    console.error('Failed to link submission:', linkError)
                }

                const { error: analysisError } = await adminSupabase
                    .from('analyses')
                    .update({ user_id: authData.user.id })
                    .eq('submission_id', submissionId)

                if (analysisError) {
                    console.error('Failed to link analysis:', analysisError)
                }
            }
        }
    }

    if (authData.user && !authData.session) {
        const nextParam = next ? `&next=${encodeURIComponent(next)}` : ''
        return redirect(`/login?message=Check your email (and junk folder) to confirm your account.${nextParam}`)
    }

    const redirectUrl = next && next.startsWith('/') ? next : '/dashboard'
    revalidatePath('/', 'layout')
    redirect(redirectUrl)
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
