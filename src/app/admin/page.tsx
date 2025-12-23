import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar, Activity, Users, Database, Globe, Search, Lock, Plus, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateSystemPrompt } from './actions'
import { PromptForm } from './prompt-form'

import { UserTable } from './user-table'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Admin Check using Database
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

  // 3. Fetch System Stats (Using Admin Client to bypass RLS)
  const [submissionsRel, profilesRel] = await Promise.all([
     adminDb
        .from('submissions')
        .select('*, profiles(email), analyses(is_unlocked, score)')
        .order('created_at', { ascending: false })
        .limit(50),
     adminDb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
  ])

  const submissions = submissionsRel.data
  const profiles = profilesRel.data

  const totalSubmissions = submissions?.length || 0
  const completedAnalyses = submissions?.filter(s => s.status === 'done').length || 0
  // Calculate revenue: count unlocked analyses * price ($4.99)
  const unlockedCount = submissions?.reduce((acc, curr) => acc + (curr.analyses?.[0]?.is_unlocked ? 1 : 0), 0) || 0
  const unlockedRevenue = unlockedCount * 4.99

  return (
    <div className="min-h-screen bg-slate-950 font-mono text-white">
       {/* Top Bar */}
       <div className="border-b border-white/10 bg-black p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest">
             <Database className="w-5 h-5" />
             Admin Dashboard
          </div>
          <div className="flex items-center gap-4 text-xs">
             <div className="text-slate-500">
                User: <span className="text-white">{user.email}</span>
             </div>
             <div className="text-slate-500">
                Status: <span className="text-green-500">ONLINE</span>
             </div>
          </div>


       </div>

       <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <KpiCard label="Submissions" value={totalSubmissions} icon={<Globe className="w-5 h-5 text-blue-500"/>} />
             <KpiCard label="Completed" value={completedAnalyses} icon={<Activity className="w-5 h-5 text-green-500"/>} />
             <KpiCard label="Active Users" value={new Set(submissions?.map(s => s.user_id)).size || 0} icon={<Users className="w-5 h-5 text-orange-500"/>} />
             <KpiCard label="Est. Revenue" value={`$${unlockedRevenue.toFixed(2)}`} icon={<Search className="w-5 h-5 text-primary"/>} />
          </div>

          <div className="grid grid-cols-1 gap-12">
            <div>
                <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Activity
                </h2>

                {/* Table */}
                <div className="border border-white/10 bg-black overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">$$$</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions?.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-slate-400 whitespace-nowrap">
                                            {new Date(sub.created_at).toLocaleDateString()}
                                            <div className="text-xs text-slate-600">{new Date(sub.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4 font-bold max-w-[150px] truncate" title={sub.profiles?.email || 'Guest'}>
                                            {sub.profiles?.email?.split('@')[0] || 'Guest'}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={sub.status} />
                                        </td>
                                        <td className="p-4">
                                            {sub.analyses?.[0]?.is_unlocked 
                                            ? <span className="text-green-500 text-xs font-bold">PAID</span> 
                                            : <span className="text-slate-700 text-xs">-</span>
                                            }
                                        </td>
                                        <td className="p-4">
                                            <Link href={`/analysis/${sub.id}`} className="text-primary hover:text-white transition-colors">
                                                <Search className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-12">
             <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Users
             </h2>
             <UserTable profiles={profiles || []} />
          </div>
       </div>
    </div>
  )
}

function KpiCard({label, value, icon}: {label: string, value: string | number, icon: React.ReactNode}) {
   return (
      <div className="bg-black border border-white/10 p-6 flex flex-col gap-2 rounded-lg">
         <div className="flex justify-between items-start">
            <span className="text-slate-500 text-xs uppercase tracking-widest">{label}</span>
            {icon}
         </div>
         <div className="text-3xl font-bold text-white">{value}</div>
      </div>
   )
}

function StatusBadge({status}: {status: string}) {
    switch(status) {
        case 'done': return <span className="text-green-500 text-xs uppercase font-bold bg-green-950/30 px-2 py-1 rounded">DONE</span>
        case 'error': return <span className="text-red-500 text-xs uppercase font-bold bg-red-950/30 px-2 py-1 rounded">ERROR</span>
        case 'processing': return <span className="text-blue-500 text-xs uppercase font-bold bg-blue-950/30 px-2 py-1 rounded animate-pulse">PROC</span>
        default: return <span className="text-slate-500 text-xs uppercase font-bold bg-slate-800/30 px-2 py-1 rounded">{status}</span>
    }
}
