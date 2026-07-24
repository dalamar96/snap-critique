import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLearningTree, getUserTotalLearningPoints } from './actions'
import { LearningDashboardClient } from './dashboard-client'

export default async function LearningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?view=signup')
  }

  const [tree, totalPoints] = await Promise.all([
    getLearningTree(),
    getUserTotalLearningPoints()
  ])

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:p-12 font-mono w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-white/10 pb-6 gap-6">
                <div>
                   <h1 className="text-3xl md:text-4xl font-bold text-white uppercase mb-2">Learning Area</h1>
                   <p className="text-slate-500 text-sm">Master your craft through guided lessons.</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Total XP</div>
                        <div className="text-2xl font-bold text-primary">{totalPoints} PTS</div>
                     </div>
                </div>
            </div>
            
            <LearningDashboardClient initialTree={tree} />
        </div>
    </div>
  )
}
