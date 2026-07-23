import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient, mockCookies } = vi.hoisted(() => {
    const mockUserClient = {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(async () => ({ error: null })),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
        },
    }
    const mockAdminClient: Record<string, unknown> = {}
    const mockCookies = { get: vi.fn((): { value: string } | undefined => undefined) }
    return { mockUserClient, mockAdminClient, mockCookies }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))
vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => mockCookies),
    headers: vi.fn(async () => ({ get: () => null })),
}))
vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`)
    }),
}))

import { login, signup, signout, forgotPassword, updatePassword } from './actions'

function formData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
}

describe('login', () => {
    beforeEach(() => {
        mockUserClient.auth.signInWithPassword.mockReset()
        mockCookies.get.mockReset().mockReturnValue(undefined)
        const base = makeFakeSupabase()
        Object.assign(mockAdminClient, base)
        // Rate limiting is allowed by default so existing behavior tests
        // aren't incidentally blocked; other RPCs (e.g. the credit check
        // inside claimGuestSubmission) default to "no credits", matching
        // this suite's prior behavior before rate limiting was added.
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: true, error: null } : { data: null, error: null }
        )
    })

    it('redirects with a rate-limit error once too many attempts have been made', async () => {
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: false, error: null } : { data: null, error: null }
        )

        await expect(login(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow(
            /REDIRECT:\/login\?error=Too many attempts/
        )
        expect(mockUserClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('redirects with an error message on invalid credentials', async () => {
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Invalid login credentials' },
        })

        await expect(login(formData({ email: 'a@b.com', password: 'wrong' }))).rejects.toThrow(
            'REDIRECT:/login?error=Invalid credentials'
        )
    })

    it('redirects with a confirm-email message when the account email is unconfirmed', async () => {
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Email not confirmed' },
        })

        await expect(login(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow(
            /REDIRECT:\/login\?message=/
        )
    })

    it('upserts the profile and redirects to /dashboard on success with no next param', async () => {
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: { id: 'user-1' } },
            error: null,
        })

        await expect(login(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow('REDIRECT:/dashboard')

        expect(mockAdminClient.from).toHaveBeenCalledWith('profiles')
    })

    it('rejects a guest-submission claim with no token, even when next points at an analysis (regression test for the signup hijack bug)', async () => {
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: { id: 'user-1' } },
            error: null,
        })
        mockCookies.get.mockReturnValue(undefined) // no guest token cookie

        const calledTables: string[] = []
        mockAdminClient.from = vi.fn((table: string) => {
            calledTables.push(table)
            return makeQueryBuilder({ data: null, error: null })
        })
        // (rpc stays at the beforeEach default: check_rate_limit allowed, everything else "no credits")

        await expect(
            login(formData({ email: 'a@b.com', password: 'x', next: '/analysis/victim-sub-id' }))
        ).rejects.toThrow('REDIRECT:/analysis/victim-sub-id')

        // claimGuestSubmission should have bailed before ever touching `submissions`
        expect(calledTables).not.toContain('submissions')
    })

    it('claims the guest submission and redirects to it when a valid token is present', async () => {
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({
            data: { user: { id: 'user-1' } },
            error: null,
        })
        mockCookies.get.mockReturnValue({ value: 'true' })

        mockAdminClient.from = vi.fn((table: string) => {
            if (table === 'submissions') return makeQueryBuilder({ data: [{ id: 'sub-1' }], error: null })
            return makeQueryBuilder({ data: null, error: null })
        })
        // (rpc stays at the beforeEach default: check_rate_limit allowed, credit check "no credits" — still claims)

        await expect(
            login(formData({ email: 'a@b.com', password: 'x', next: '/analysis/sub-1' }))
        ).rejects.toThrow('REDIRECT:/analysis/sub-1')
    })
})

describe('signup', () => {
    beforeEach(() => {
        mockUserClient.auth.signUp.mockReset()
        mockCookies.get.mockReset().mockReturnValue(undefined)
        const base = makeFakeSupabase()
        Object.assign(mockAdminClient, base)
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: true, error: null } : { data: null, error: null }
        )
    })

    it('redirects with a rate-limit error once too many signup attempts have been made', async () => {
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: false, error: null } : { data: null, error: null }
        )

        await expect(signup(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow(
            /REDIRECT:\/login\?error=Too many signup attempts/
        )
        expect(mockUserClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('redirects to /login with the auth error message on signup failure', async () => {
        mockUserClient.auth.signUp.mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'User already registered' },
        })

        await expect(signup(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow(
            /REDIRECT:\/login\?error=User already registered/
        )
    })

    it('redirects to check-your-email when signup succeeds but there is no session yet', async () => {
        mockUserClient.auth.signUp.mockResolvedValueOnce({
            data: { user: { id: 'user-1' }, session: null },
            error: null,
        })

        await expect(signup(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow(
            /REDIRECT:\/login\?message=Check your email/
        )
        expect(mockAdminClient.from).toHaveBeenCalledWith('profiles')
    })

    it('redirects to /dashboard when signup returns an immediate session', async () => {
        mockUserClient.auth.signUp.mockResolvedValueOnce({
            data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
            error: null,
        })

        await expect(signup(formData({ email: 'a@b.com', password: 'x' }))).rejects.toThrow('REDIRECT:/dashboard')
    })

    it('never claims a submission it has no guest token for, even with a crafted next param (regression test for the hijack bug)', async () => {
        mockUserClient.auth.signUp.mockResolvedValueOnce({
            data: { user: { id: 'attacker-1' }, session: { access_token: 'tok' } },
            error: null,
        })
        mockCookies.get.mockReturnValue(undefined)

        const calledTables: string[] = []
        mockAdminClient.from = vi.fn((table: string) => {
            calledTables.push(table)
            return makeQueryBuilder({ data: null, error: null })
        })

        await expect(
            signup(formData({ email: 'attacker@evil.com', password: 'x', next: '/analysis/victim-sub-id' }))
        ).rejects.toThrow('REDIRECT:/analysis/victim-sub-id')

        expect(calledTables).not.toContain('submissions')
    })
})

describe('signout', () => {
    it('signs out and redirects to /login', async () => {
        await expect(signout()).rejects.toThrow('REDIRECT:/login')
        expect(mockUserClient.auth.signOut).toHaveBeenCalled()
    })
})

describe('forgotPassword', () => {
    beforeEach(() => {
        mockUserClient.auth.resetPasswordForEmail.mockReset()
    })

    it('redirects with an error message when the reset email fails to send', async () => {
        mockUserClient.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'boom' } })

        await expect(forgotPassword(formData({ email: 'a@b.com' }))).rejects.toThrow(
            /REDIRECT:\/forgot-password\?error=/
        )
    })

    it('redirects with a confirmation message on success', async () => {
        mockUserClient.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null })

        await expect(forgotPassword(formData({ email: 'a@b.com' }))).rejects.toThrow(
            /REDIRECT:\/forgot-password\?message=/
        )
    })
})

describe('updatePassword', () => {
    beforeEach(() => {
        mockUserClient.auth.updateUser.mockReset()
    })

    it('redirects with an error when the passwords do not match', async () => {
        await expect(
            updatePassword(formData({ password: 'a', confirmPassword: 'b' }))
        ).rejects.toThrow(/REDIRECT:\/update-password\?error=Passwords do not match/)
        expect(mockUserClient.auth.updateUser).not.toHaveBeenCalled()
    })

    it('redirects to /dashboard on success', async () => {
        mockUserClient.auth.updateUser.mockResolvedValueOnce({ error: null })

        await expect(
            updatePassword(formData({ password: 'samepass', confirmPassword: 'samepass' }))
        ).rejects.toThrow('REDIRECT:/dashboard')
    })
})
