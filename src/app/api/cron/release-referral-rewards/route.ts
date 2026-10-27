import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Daily Vercel Cron (see vercel.json): pays out referral rewards whose
// refund/chargeback hold period has passed. Vercel sends
// `Authorization: Bearer $CRON_SECRET` when the CRON_SECRET env var is set.
export async function GET(req: Request) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: released, error } = await supabase.rpc('release_referral_rewards')

    if (error) {
        console.error('[Cron] Failed to release referral rewards:', error)
        return NextResponse.json({ error: 'Release failed' }, { status: 500 })
    }

    console.log(`[Cron] Released ${released ?? 0} referral reward(s)`)
    return NextResponse.json({ released: released ?? 0 })
}
