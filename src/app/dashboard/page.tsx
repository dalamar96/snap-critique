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
import { signPreviewUrls } from '@/lib/signed-urls'
import { LazyProgressSection } from './progress/progress-section-lazy'

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
        .select('id, created_at, category, status, lesson_id, image_path, thumbnail_path, analyses(id, title, score, is_public)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single(),
      getProgressData(supabase, user.id)
  ])

  const submissions = submissionsRel.data
  const profile = profileRel.data

  // Enhance submissions with signed URLs (batched: 2 requests total)
  const subs = submissions ?? []
  const thumbUrls = await signPreviewUrls(supabase, subs, (sub) => ({
    // Use stored thumbnail_path if available, otherwise fallback to convention
    preview: sub.image_path ? (sub.thumbnail_path || sub.image_path.replace('uploads/', 'previews/')) : null,
    original: sub.image_path ?? null,
  }))
  const submissionsWithImages = subs.map((sub, i) => ({ ...sub, thumbnailUrl: thumbUrls[i] }))

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
             <LazyProgressSection data={progressData} />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
             {/* CTA Card */}
             <Link href="/" className="group flex flex-col items-center justify-center gap-2 aspect-square min-w-0 bg-primary/5 border border-dashed border-primary/30 hover:bg-primary/10 hover:border-primary transition-all rounded-lg p-4 text-center">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <div className="text-xl text-primary font-bold leading-none">+</div>
                </div>
                <div className="min-w-0">
                   <h3 className="text-white font-bold text-xs uppercase tracking-wider group-hover:text-primary transition-colors">Analyze New</h3>
                   <p className="text-slate-500 text-[9px] uppercase mt-0.5">Get feedback</p>
                </div>
             </Link>

             {submissionsWithImages && submissionsWithImages.length > 0 ? (
               submissionsWithImages.map((sub) => {
                  const CategoryIcon = CATEGORY_ICONS[sub.category] || Sparkles
                  const analysis = sub.analyses?.[0]
                  return (
                  <div
                     key={sub.id}
                     className="group relative flex flex-col min-w-0 bg-black border border-white/10 hover:border-primary/50 transition-colors rounded-lg overflow-hidden"
                  >
                     {/* Overlay Link covers the whole card except where pointer-events are auto */}
                     <Link href={`/analysis/${sub.id}`} className="absolute inset-0 z-10" />

                     {/* Thumbnail */}
                     <div className="relative aspect-square bg-white/5 flex items-center justify-center overflow-hidden pointer-events-none">
                        {sub.thumbnailUrl ? (
                            <img
                              src={sub.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <FileImage className="w-8 h-8 text-slate-500 group-hover:text-primary transition-colors" />
                        )}

                        {/* Score badge */}
                        <div className={`absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-sm font-bold ${scoreColor(analysis?.score)}`}>
                           {analysis?.score ?? '--'}
                        </div>

                        {/* Homework badge */}
                        {sub.lesson_id && (
                           <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md p-1" title="Homework assignment">
                              <GraduationCap className="w-3.5 h-3.5 text-primary" />
                           </div>
                        )}

                        {/* Status overlay */}
                        {sub.status === 'processing' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            </div>
                        )}
                        {sub.status === 'error' && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                                <span className="text-[9px] uppercase font-bold text-red-500">Failed</span>
                            </div>
                        )}
                     </div>

                     {/* Info */}
                     <div className="p-2.5 min-w-0 pointer-events-none">
                        <h3 className="text-white font-bold text-xs truncate group-hover:text-primary transition-colors">
                           {analysis?.title || 'Unknown Subject'}
                        </h3>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-wide mt-0.5 truncate">
                           <CategoryIcon className="w-2.5 h-2.5 shrink-0" />
                           <span className="truncate">{sub.category}</span>
                           <span className="text-slate-700">&bull;</span>
                           <span className="truncate">{formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}</span>
                        </div>
                     </div>

                     {/* Actions */}
                     {sub.status === 'done' && (
                        <div className="relative z-20 pointer-events-auto flex justify-end px-2.5 pb-2.5 pt-1 border-t border-white/5">
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
                <div className="col-span-full text-center py-20 border border-dashed border-white/10">
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
