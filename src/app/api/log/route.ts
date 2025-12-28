import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { level, message, stack, context } = body

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        const adminDb = createAdminClient()

        await adminDb.from('error_logs').insert({
            level: level || 'error',
            message,
            stack,
            context,
            user_id: context?.userId,
            source: 'client'
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Log Endpoint Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
