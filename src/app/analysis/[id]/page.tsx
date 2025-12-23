import { CritiqueDisplay } from '@/components/critique-display'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export default async function ResultsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ unlocked?: string, session_id?: string }> }) {
  const { id } = await params
  const { session_id } = await searchParams
  
  const supabase = createAdminClient()

  // 1. If session_id exists, verify payment and update DB
  if (session_id) {
     console.log(`[Payment] Verifying session: ${session_id} for submission: ${id}`)
     try {
       const session = await stripe.checkout.sessions.retrieve(session_id)
       console.log(`[Payment] Status: ${session.payment_status}`)
       
       if (session.payment_status === 'paid') {
          const { error } = await supabase
            .from('analyses')
            .update({ is_unlocked: true })
            .eq('submission_id', id)
          
          if (error) {
             console.error("[Payment] DB Update Failed:", error)
          } else {
             console.log("[Payment] Unlock Successful")
          }
       }
     } catch (e) {
       console.error("[Payment] Stripe Verification Failed", e)
     }
     
     // Redirect to remove query params for clean URL
     redirect(`/analysis/${id}`)
  }

  // 2. Fetch Submission First (Source of Truth for Status)
  const { data: submissionRecord } = await supabase
    .from('submissions')
    .select('*, profiles(email)')
    .eq('id', id)
    .single()

  if (!submissionRecord) {
     return notFound()
  }

  // Handle Error/Processing States
  if (submissionRecord.status === 'error') {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
              <div className="text-center space-y-4 max-w-md border border-red-500/20 bg-red-950/10 p-8 rounded-lg">
                  <div className="text-red-500 font-bold uppercase tracking-widest text-xl">Analysis Failed</div>
                  <p className="text-slate-400">The AI could not process this image. This has been logged for review.</p>
                  <div className="text-xs font-mono text-slate-600 border-t border-red-500/20 pt-4 mt-4">
                      ID: {id}
                  </div>
              </div>
          </div>
      )
  }

  if (submissionRecord.status === 'processing' || submissionRecord.status === 'pending') {
       return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
              <div className="text-center space-y-4 animate-pulse">
                  <div className="text-primary font-bold uppercase tracking-widest text-xl">Processing Result...</div>
                  <p className="text-slate-400">Please refresh in a few moments.</p>
              </div>
          </div>
      )
  }

  // 3. Fetch Analysis Data (Only if Done)
  const { data: analysisRecord } = await supabase
    .from('analyses')
    .select('*')
    .eq('submission_id', id)
    .single()
    
  if (!analysisRecord) {
     // Edge case where status is done but analysis missing
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-white text-xl">Analysis Record Missing</h1>
              <p className="text-slate-500">Status is 'done' but data is not found.</p>
            </div>
          </div>
      )
  }

  // 4. Get Image URL
  let imageUrl = null;
  if (submissionRecord?.image_path) {
      // Try to get signed URL for preview
      const previewPath = submissionRecord.image_path.replace('uploads/', 'previews/');
      const { data: signedUrlData } = await supabase.storage
        .from('submissions')
        .createSignedUrl(previewPath, 60 * 60) // 1 hour
      
      if (signedUrlData?.signedUrl) {
          imageUrl = signedUrlData.signedUrl
      } else {
          // Fallback to original
          const { data: signedUrlOriginal } = await supabase.storage
            .from('submissions')
            .createSignedUrl(submissionRecord.image_path, 60 * 60)
             imageUrl = signedUrlOriginal?.signedUrl || null
      }
  }

  // 5. Determine Lock Status from DB (Single Source of Truth)
  const isUnlocked = analysisRecord.is_unlocked

  // Type assertion
  const analysisData = analysisRecord.full_critique as any 
  
  // 6. Auth Context & Security Guard
  const supabaseAuth = createClient()
  const { data: { user } } = await (await supabaseAuth).auth.getUser()
  
  // Security Check: Access Control
  if (submissionRecord.user_id) {
      if (!user) {
          // Owned resource, but user not logged in -> Redirect to Login
          redirect(`/login?next=${encodeURIComponent(`/analysis/${id}`)}`)
      }
      
      if (user.id !== submissionRecord.user_id) {
          // Owned resource, but user mismatch -> 404 Not Found (Hide existence)
          return notFound()
      }
  }

  let userCredits = 0
  
  if (user) {
      // Fetch Credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single()
      
      userCredits = profile?.credits_balance || 0
      
      // Claim Submission if Guest (orphaned)
      if (!submissionRecord.user_id) {
          await supabase
            .from('submissions')
            .update({ user_id: user.id })
            .eq('id', id)
            
          // We don't verify update success for speed, assume it works if RLS allows or we use admin client (we use admin client here)
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        <CritiqueDisplay 
            analysis={analysisData} 
            analysisId={id} 
            isUnlocked={isUnlocked} 
            imageUrl={imageUrl}
            userCredits={userCredits}
            isGuest={!user}
        />
      </div>
    </div>
  )
}
