'use server'

import { redirect } from 'next/navigation'
import { unsubscribeByToken } from '@/lib/marketing-opt-out'

export async function confirmUnsubscribe(formData: FormData) {
    const token = formData.get('token')
    const ok = await unsubscribeByToken(typeof token === 'string' ? token : null)
    redirect(ok ? '/unsubscribe?done=1' : '/unsubscribe?error=1')
}
