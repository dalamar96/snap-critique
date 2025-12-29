import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Terminal, Clock, CheckCircle, AlertCircle, FileImage, LayoutDashboard, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardPublicToggle } from '@/components/dashboard-public-toggle'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parallel fetch: Submissions and Profile
  const [submissionsRel, profileRel] = await Promise.all([
      (await supabase)
        .from('submissions')
        .select('*, analyses(id, title, score, is_public)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      (await supabase)
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single()
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

          {/* Grid */}
          <div className="grid gap-4">
             {/* CTA Card */}
             <Link href="/" className="group block bg-primary/5 border border-dashed border-primary/30 hover:bg-primary/10 hover:border-primary transition-all p-4 md:p-6 flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <div className="text-2xl text-primary font-bold">+</div>
                </div>
                <div className="text-left">
                   <h3 className="text-white font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Analyze New Image</h3>
                   <p className="text-slate-500 text-xs uppercase">Get instant feedback</p>
                </div>
             </Link>

             {submissionsWithImages && submissionsWithImages.length > 0 ? (
               submissionsWithImages.map((sub) => (
                  <div 
                     key={sub.id} 
                     className="group relative block bg-black border border-white/10 hover:border-primary transition-all p-4 md:p-6"
                  >
                     {/* Overlay Link covers the whole card except where pointer-events are auto */}
                     <Link href={`/analysis/${sub.id}`} className="absolute inset-0 z-0" />
                     
                     <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 relative z-10 pointer-events-none">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                           <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative rounded-sm">
                              {sub.thumbnailUrl ? (
                                  <img 
                                    src={sub.thumbnailUrl} 
                                    alt="Thumbnail" 
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                  />
                              ) : (
                                  <FileImage className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                              )}
                           </div>
                           
                           {/* Mobile Only: Score next to image */}
                           <div className="sm:hidden ml-auto text-right">
                               <div className="text-2xl font-bold text-primary">{sub.analyses?.[0]?.score || '--'}</div>
                               <div className="text-[10px] text-slate-500 uppercase">Score</div>
                           </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-white font-bold text-base md:text-lg truncate max-w-full group-hover:text-primary transition-colors">
                                 {sub.analyses?.[0]?.title || 'Unknown Subject'}
                              </h3>
                              {sub.status === 'done' && <span className="text-[10px] bg-green-900/30 text-green-500 px-2 py-0.5 border border-green-900 uppercase whitespace-nowrap">Complete</span>}
                              {sub.status === 'processing' && <span className="text-[10px] bg-blue-900/30 text-blue-500 px-2 py-0.5 border border-blue-900 uppercase animate-pulse whitespace-nowrap">Processing</span>}
                              {sub.status === 'error' && <span className="text-[10px] bg-red-900/30 text-red-500 px-2 py-0.5 border border-red-900 uppercase whitespace-nowrap">Failed</span>}
                           </div>
                           <p className="text-slate-500 text-xs uppercase truncate">
                              {new Date(sub.created_at).toLocaleDateString()} // {sub.category}
                           </p>
                        </div>

                        {/* Desktop: Score and Toggle */}
                        <div className="hidden sm:flex text-right shrink-0 flex-col items-end gap-2 pointer-events-auto min-w-[80px]">
                           <div className="flex flex-col items-end">
                               <div className="text-3xl font-bold text-primary">{sub.analyses?.[0]?.score || '--'}</div>
                               <div className="text-[10px] text-slate-500 uppercase">Score</div>
                           </div>
                           {sub.status === 'done' && (
                               <div className="mt-2">
                                   <DashboardPublicToggle 
                                        submissionId={sub.id} 
                                        initialIsPublic={!!sub.analyses?.[0]?.is_public}
                                   />
                               </div>
                           )}
                        </div>
                        
                        {/* Mobile: Toggle only (Score moved top) */}
                        <div className="sm:hidden flex justify-between items-center w-full pt-2 border-t border-white/5 pointer-events-auto">
                            <span className="text-xs text-slate-500 uppercase">Visibility</span>
                            {sub.status === 'done' && (
                               <DashboardPublicToggle 
                                    submissionId={sub.id} 
                                    initialIsPublic={!!sub.analyses?.[0]?.is_public}
                               />
                           )}
                        </div>
                     </div>
                  </div>
               ))
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
