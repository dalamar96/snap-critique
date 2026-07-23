// Shared NSFW threshold — single source of truth for both the client-side
// blur (gallery-item.tsx) and the server-side enforcement gate
// (togglePublicStatus in analysis/actions.ts). Previously only the client
// blur existed, which was cosmetic: a flagged analysis could still be
// marked public and viewed directly, the gallery grid was just the one
// place it happened to be hidden.
export const NSFW_THRESHOLD = 75

export function isNsfwFlagged(nsfwScore: number | null | undefined): boolean {
    return (nsfwScore ?? 0) > NSFW_THRESHOLD
}
