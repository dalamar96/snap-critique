import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle, FileImage, LayoutDashboard, GraduationCap, Loader2,
  User, Mountain, Building2, PawPrint, Building, Flower2, Sparkles, Package, PartyPopper
} from 'lucide-react'
import { DashboardPublicToggle } from '@/components/dashboard-public-toggle'
import { getProgressData } from './progress-data'
import { ProgressSection } from './progress/progress-section'

const CATEGORY_ICONS: Record<string, typeof User> = {
  portrait: User,
  landscape: Mountain,
  street: Building2,
  wildlife: PawPrint,
  architecture: Building,
  macro: Flower2,
  product: Package,
  event: PartyPopper,
  other: Sparkles,
}

function scoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return 'text-slate-600'
  if (score >= 85) return 'text-emerald-400'
  if (score >= 65) return 'text-primary'
  return 'text-red-400'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parallel fetch: Submissions, Profile, and Progress data
  const [submissionsRel, profileRel, progressData] = await Promise.all([
      supabase
        .from('submissions')
        .select('*, analyses(id, title, score, is_public)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single(),
      getProgressData(supabase, user.id)
  ])

  const submissions = submissionsRel.data
  const profile = profileRel.data

  // Enhance submissions with signed URLs for thumbnails
  const submissionsWithImages = submissions ? await Promise.all(submissions.map(async (sub) => {
      let imageUrl = null

      if (sub.image_path) {
          // 1. Try Preview Path first
          // Use stored thumbnail_path if available, otherwise fallback to convention
          const previewPath = sub.thumbnail_path || sub.image_path.replace('uploads/', 'previews/')
          const { data: previewData } = await supabase.storage
            .from('submissions')
            .createSignedUrl(previewPath, 3600)
          
          if (previewData?.signedUrl) {
              imageUrl = previewData.signedUrl
          } else {
              // 2. Fallback to Original
              const { data: originalData } = await supabase.storage
                .from('submissions')
                .createSignedUrl(sub.image_path, 3600)
              
              if (originalData?.signedUrl) {
                  imageUrl = originalData.signedUrl
              }
          }
      }

      return {
          ...sub,
          thumbnailUrl: imageUrl
      }
  })) : []

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:p-12 font-mono w-full max-w-[100vw] overflow-x-hidden">
       <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8 md:mb-12 border-b border-white/10 pb-6">
             <div>
                <div className="text-primary text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                   <LayoutDashboard className="w-4 h-4" />
                   Overview
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white uppercase">Your Critiques</h1>
             </div>
             <div className="w-full md:w-auto flex flex-col items-start md:items-end">
                <div className="text-slate-500 text-xs uppercase mb-1">Account</div>
                <div className="text-white font-mono mb-2">{user.email}</div>
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs uppercase tracking-wide">
                        <span className="text-primary font-bold">{profile?.credits_balance || 0}</span> Credits Available
                    </div>
                    <Link href="/pricing" className="text-[10px] uppercase font-bold text-primary hover:text-white transition-colors border border-primary/30 px-2 py-1 hover:bg-primary hover:border-primary text-center whitespace-nowrap">
                        + Get More
                    </Link>
                </div>
                <div className="mt-2 w-full md:w-auto text-left md:text-right">
                     <Link href="/support" className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest flex items-center md:justify-end gap-1">
                        Need Help? 
                     </Link>
                </div>
             </div>
          </div>

          {/* Progress */}
          <div className="mb-8 md:mb-12">
             <ProgressSection data={progressData} />
          </div>

          {/* Grid */}
          <div className="grid gap-2">
             {/* CTA Card */}
             <Link href="/" className="group flex items-center gap-3 min-w-0 bg-primary/5 border border-dashed border-primary/30 hover:bg-primary/10 hover:border-primary transition-all px-4 py-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <div className="text-lg text-primary font-bold leading-none">+</div>
                </div>
                <div className="text-left min-w-0">
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider group-hover:text-primary transition-colors truncate">Analyze New Image</h3>
                   <p className="text-slate-500 text-[10px] uppercase">Get instant feedback</p>
                </div>
             </Link>

             {submissionsWithImages && submissionsWithImages.length > 0 ? (
               submissionsWithImages.map((sub) => {
                  const CategoryIcon = CATEGORY_ICONS[sub.category] || Sparkles
                  const analysis = sub.analyses?.[0]
                  return (
                  <div
                     key={sub.id}
                     className="group relative flex items-center gap-3 md:gap-4 min-w-0 bg-black border border-white/10 hover:border-primary/50 transition-colors px-3 py-2.5 md:px-4"
                  >
                     {/* Overlay Link covers the whole card except where pointer-events are auto */}
                     <Link href={`/analysis/${sub.id}`} className="absolute inset-0 z-0" />

                     {/* Thumbnail */}
                     <div className="w-11 h-11 md:w-12 md:h-12 bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative rounded-md z-10 pointer-events-none">
                        {sub.thumbnailUrl ? (
                            <img
                              src={sub.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <FileImage className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                        )}
                        {sub.status === 'processing' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            </div>
                        )}
                     </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                        <div className="flex items-center gap-1.5">
                           <h3 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
                              {analysis?.title || 'Unknown Subject'}
                           </h3>
                           {sub.lesson_id && (
                              <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Homework assignment" />
                           )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wide mt-0.5 truncate">
                           <CategoryIcon className="w-3 h-3 shrink-0" />
                           <span className="truncate">{sub.category}</span>
                           <span className="text-slate-700">&bull;</span>
                           <span className="truncate">{formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}</span>
                           {sub.status === 'error' && (
                              <>
                                 <span className="text-slate-700">&bull;</span>
                                 <span className="text-red-500 font-bold">Failed</span>
                              </>
                           )}
                        </div>
                     </div>

                     {/* Score */}
                     <div className={`shrink-0 text-right relative z-10 pointer-events-none w-9 md:w-11 text-xl md:text-2xl font-bold ${scoreColor(analysis?.score)}`}>
                        {analysis?.score ?? '--'}
                     </div>

                     {/* Actions */}
                     {sub.status === 'done' && (
                        <div className="shrink-0 relative z-10 pointer-events-auto">
                           <DashboardPublicToggle
                                submissionId={sub.id}
                                initialIsPublic={!!analysis?.is_public}
                                compact
                           />
                        </div>
                     )}
                  </div>
               )})
             ) : (
                <div className="text-center py-20 border border-dashed border-white/10">
                   <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                   <h3 className="text-white font-bold uppercase mb-2">No Critiques Found</h3>
                   <Link href="/" className="text-primary hover:underline text-xs uppercase tracking-widest">
                      &gt;&gt; Get Feedback
                   </Link>
                </div>
             )}
          </div>
       </div>
    </div>
  )
}
