import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getAdminDashboardData } from './actions'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Admin Check
  const adminDb = createAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
     return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
           <div className="text-center space-y-4">
              <Lock className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-3xl font-bold text-white uppercase tracking-widest">Access Denied</h1>
              <p className="text-red-500 font-mono text-sm">You do not have permission to view this page.</p>
              <div className="p-4 bg-white/5 rounded border border-white/10 text-xs text-slate-400">
                  User ID: {user.id}
              </div>
              <Link href="/dashboard" className="inline-block px-4 py-2 bg-white text-black font-bold uppercase text-sm hover:bg-slate-200">Return to Dashboard</Link>
           </div>
        </div>
     )
  }

  // Fetch Data using aggregated action
  const dashboardData = await getAdminDashboardData()

  return <DashboardClient data={dashboardData} userEmail={user.email || 'Admin'} />
}
