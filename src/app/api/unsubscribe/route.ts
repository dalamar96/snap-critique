import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/marketing-opt-out'

// RFC 8058 one-click unsubscribe target, referenced by the List-Unsubscribe
// header on reminder emails. Mail clients (Gmail, Apple Mail) POST here
// directly when the user hits their built-in "Unsubscribe" button.
export async function POST(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token')
    const ok = await unsubscribeByToken(token)
    return NextResponse.json({ success: ok }, { status: ok ? 200 : 400 })
}
