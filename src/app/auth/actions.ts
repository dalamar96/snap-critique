'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { claimGuestSubmission } from '@/lib/claim-guest-submission'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { recordReferral, REFERRAL_COOKIE } from '@/lib/referrals'

// Given a `next` redirect target, returns the submission ID if it points at
// an analysis page, otherwise null. Shared by login() and signup() so both
// extract the ID from `next` the same way.
function extractSubmissionIdFromNext(next: string | undefined): string | null {
    if (!next || !next.startsWith('/analysis/')) return null
    const path = next.split('?')[0] // /analysis/[id]
    return path.split('/').pop() || null
}

export async function login(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const ip = await getClientIp()
    const allowed = await checkRateLimit(adminSupabase, `login:${ip}`, 10, 60)
    if (!allowed) {
        redirect('/login?error=Too many attempts. Please wait a minute and try again.')
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            redirect('/login?message=Please confirm your email address before logging in. Check your email (and junk folder) if you don\'t see it.')
        }
        redirect('/login?error=Invalid credentials')
    }

    if (data.user) {
        // Ensure profile exists. If not, create with 5 credits. If exists, do nothing.
        await adminSupabase.from('profiles').upsert({
            id: data.user.id,
            email: email,

            credits_balance: 5
        }, { onConflict: 'id', ignoreDuplicates: true })
    }

    const next = formData.get('next') as string
    const redirectUrl = next && next.startsWith('/') ? next : '/dashboard'

    // Link Guest Submission if 'next' param points to an analysis
    const submissionId = extractSubmissionIdFromNext(next)
    if (submissionId && data.user) {
        const cookieStore = await cookies()
        const guestToken = cookieStore.get(`guest_token_${submissionId}`)?.value

        await claimGuestSubmission({
            adminDb: adminSupabase,
            userId: data.user.id,
            submissionId,
            guestToken,
        })
    }

    revalidatePath('/', 'layout')
    redirect(redirectUrl)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const ip = await getClientIp()
    const allowed = await checkRateLimit(adminSupabase, `signup:${ip}`, 5, 60)
    if (!allowed) {
        redirect('/login?error=Too many signup attempts. Please wait a minute and try again.')
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = formData.get('next') as string

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'https://www.snapcritique.com';

    let emailRedirectTo = `${siteUrl}/auth/callback`

    if (emailRedirectTo && next) {
        emailRedirectTo += `?next=${encodeURIComponent(next)}`
    }
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

        // 3. Attribute to a referrer if they arrived via a ?ref= link
        const cookieStore = await cookies()
        await recordReferral(adminSupabase, authData.user.id, cookieStore.get(REFERRAL_COOKIE)?.value)

        // 4. Link Guest Submission if 'next' param points to an analysis
        const submissionId = extractSubmissionIdFromNext(next)
        if (submissionId) {
            const guestToken = cookieStore.get(`guest_token_${submissionId}`)?.value

            await claimGuestSubmission({
                adminDb: adminSupabase,
                userId: authData.user.id,
                submissionId,
                guestToken,
            })
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

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'https://www.snapcritique.com';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
    })

    if (error) {
        console.error('Reset password error:', error)
        redirect('/forgot-password?error=Could not send reset link. Please try again.')
    }

    redirect('/forgot-password?message=Check your email for the password reset link.')
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        redirect('/update-password?error=Passwords do not match')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        console.error('Update password error:', error)
        redirect('/update-password?error=Could not update password. Please try again.')
    }

    redirect('/dashboard')
}
