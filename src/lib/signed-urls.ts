import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'submissions'

/**
 * Signs many storage paths in ONE request (createSignedUrls) instead of one
 * request per path. Returns a map of path -> signed URL; paths that couldn't
 * be signed (e.g. missing object) are absent from the map.
 */
export async function signPaths(
    supabase: SupabaseClient,
    paths: string[],
    expiresIn = 3600
): Promise<Map<string, string>> {
    const out = new Map<string, string>()
    const unique = Array.from(new Set(paths.filter(Boolean)))
    if (unique.length === 0) return out

    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, expiresIn)
    for (const entry of data ?? []) {
        if (entry.path && entry.signedUrl && !entry.error) out.set(entry.path, entry.signedUrl)
    }
    return out
}

/**
 * Resolves a display image URL for each item: prefers the preview path, and
 * falls back to the original if the preview couldn't be signed. Two batched
 * requests total, regardless of item count.
 */
export async function signPreviewUrls<T>(
    supabase: SupabaseClient,
    items: T[],
    getPaths: (item: T) => { preview: string | null; original: string | null },
    expiresIn = 3600
): Promise<(string | null)[]> {
    const paths = items.map(getPaths)
    const previews = await signPaths(supabase, paths.map(p => p.preview ?? ''), expiresIn)

    const needFallback = paths
        .filter(p => !(p.preview && previews.has(p.preview)) && p.original)
        .map(p => p.original as string)
    const originals = await signPaths(supabase, needFallback, expiresIn)

    return paths.map(p =>
        (p.preview && previews.get(p.preview)) || (p.original && originals.get(p.original)) || null
    )
}
