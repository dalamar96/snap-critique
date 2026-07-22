import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

type QueryResult<T = unknown> = { data: T; error: unknown; count?: number }
type FakeBuilder = Record<string, (...args: unknown[]) => unknown>

/**
 * A chainable fake for Supabase's query builder (`.from().select().eq()...`).
 * Every intermediate method returns the builder itself so any chain shape
 * works; the chain is "thenable" so `await`-ing it (with or without a
 * trailing `.single()`) resolves to the configured result.
 */
export function makeQueryBuilder<T = unknown>(result: QueryResult<T>): FakeBuilder {
    const builder: FakeBuilder = {}
    // Each chain method is its own vi.fn() (not a shared plain function) so
    // tests can assert on individual calls, e.g.
    // `expect(builder.update).toHaveBeenCalledWith({...})`.
    const chain = () => vi.fn(() => builder)

    builder.select = chain()
    builder.insert = chain()
    builder.update = chain()
    builder.delete = chain()
    builder.upsert = chain()
    builder.eq = chain()
    builder.is = chain()
    builder.in = chain()
    builder.order = chain()
    builder.limit = chain()
    builder.single = vi.fn(() => Promise.resolve(result))
    builder.then = vi.fn((resolve: unknown, reject?: unknown) =>
        Promise.resolve(result).then(resolve as (v: QueryResult<T>) => unknown, reject as ((r: unknown) => unknown) | undefined)
    )

    return builder
}

/**
 * A fake Supabase client (works for both createClient() and
 * createAdminClient() shapes) for unit-testing server actions/routes
 * without a real database. Configure `from`/`rpc`/`getUser` per test;
 * anything left unconfigured returns an empty/null result rather than
 * throwing, so tests only need to wire up what they actually exercise.
 *
 * Returned as `SupabaseClient` (structurally cast) so call sites don't need
 * their own `as any`/`as SupabaseClient` casts.
 */
export function makeFakeSupabase(opts: {
    from?: (table: string) => FakeBuilder
    rpc?: (fn: string, args: Record<string, unknown>) => QueryResult | Promise<QueryResult>
    getUser?: () => { data: { user: unknown } } | Promise<{ data: { user: unknown } }>
} = {}): SupabaseClient {
    const client = {
        from: vi.fn((table: string) =>
            opts.from ? opts.from(table) : makeQueryBuilder({ data: null, error: null })
        ),
        rpc: vi.fn(async (fn: string, args: Record<string, unknown>) =>
            opts.rpc ? await opts.rpc(fn, args) : { data: null, error: null }
        ),
        auth: {
            getUser: vi.fn(async () =>
                opts.getUser ? await opts.getUser() : { data: { user: null } }
            ),
        },
        storage: {
            from: vi.fn(() => ({
                download: vi.fn(async () => ({ data: null, error: null })),
                createSignedUrl: vi.fn(async () => ({ data: null, error: null })),
                remove: vi.fn(async () => ({ data: null, error: null })),
            })),
        },
    }

    return client as unknown as SupabaseClient
}
