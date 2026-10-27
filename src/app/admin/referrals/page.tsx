import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getIsAdmin } from '@/lib/auth/require-admin'
import { redirect } from 'next/navigation'
import { getReferralAdminData } from './actions'
import { AdminReferralsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function AdminReferralsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Non-admins get the Access Denied screen on /admin.
    if (!(await getIsAdmin(createAdminClient(), user.id))) redirect('/admin')

    const data = await getReferralAdminData()

    return <AdminReferralsClient data={data} />
}
