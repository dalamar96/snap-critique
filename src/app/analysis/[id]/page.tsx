import { AnalysisContainer } from '@/components/analysis-container'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { ShareAnalysisDialog } from '@/components/share-analysis-dialog'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch minimal data for metadata
  const { data: analysis } = await supabase
    .from('analyses')
    .select('title, score, is_public')
    .eq('submission_id', id)
    .single()
    
  const { data: submission } = await supabase
    .from('submissions')
    .select('image_path')
    .eq('id', id)
    .single()

  if (!analysis) {
      return {
          title: 'Analysis Not Found | Snap Critique'
      }
  }

  let imageUrl = '/og-image.jpg' // Default 
  if (submission?.image_path) {
      // Create a public URL or Signed URL. 
      // For OG tags, the URL needs to be publicly accessible by the social crawler.
      // If it's a private bucket, we need a signed URL with long expiration or a proxy.
      // We will generate a signed URL with 1hr expiration which 'should' be enough for the crawler to cache it immediately.
      const { data } = await supabase.storage
        .from('submissions')
        .createSignedUrl(submission.image_path, 3600)
      if (data?.signedUrl) imageUrl = data.signedUrl
  }

  return {
      title: `${analysis.title} | Snap Critique`,
      description: `Analysis Score: ${analysis.score}/100. Get AI feedback on your photography with Snap Critique.`,
      openGraph: {
          title: analysis.title,
          description: `I got a ${analysis.score}/100 composition score on Snap Critique.`,
          images: [imageUrl]
      },
      twitter: {
          card: 'summary_large_image',
          title: analysis.title,
          description: `Analysis Score: ${analysis.score}/100`,
          images: [imageUrl]
      }
  }
}

export default async function ResultsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ unlocked?: string, session_id?: string }> }) {
  console.log("Rendering ResultsPage")
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

  // 5. Auth Context & Security Guard (Moved Up)
  const supabaseAuth = createClient()
  const { data: { user } } = await (await supabaseAuth).auth.getUser()

  let userCredits = 0
  let isAdmin = false
  
  if (user) {
      // Fetch Credits & Admin Status
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, is_admin')
        .eq('id', user.id)
        .single()
      
      userCredits = profile?.credits_balance || 0
      isAdmin = profile?.is_admin || false
  }

  // Soft Delete Check
  if (submissionRecord.deleted_at && !isAdmin) {
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


  // Claim Submission if Guest (orphaned) AND not visiting as an admin
  if (user && !submissionRecord.user_id && !isAdmin) {
      await supabase
        .from('submissions')
        .update({ user_id: user.id })
        .eq('id', id)
        
      submissionRecord.user_id = user.id // Update local record to reflect claim
  }

  // Security Check: Access Control
  if (submissionRecord.user_id) {
      // Check if public access allowed
      const isPublic = analysisRecord.is_public

      if (!user && !isPublic) {
          // Owned resource, not public, user not logged in -> Redirect to Login
          redirect(`/login?next=${encodeURIComponent(`/analysis/${id}`)}`)
      }
      
      if (user && user.id !== submissionRecord.user_id && !isAdmin && !isPublic) {
          // Owned resource, mismatched user, NOT ADMIN, NOT PUBLIC -> 404 Not Found (Hide existence)
          return notFound()
       }
  }

  // 6. Determine Lock Status from DB (Single Source of Truth) OR Admin Override OR Owner Override
  const isOwner = user && submissionRecord.user_id === user.id
  const isUnlocked = analysisRecord.is_unlocked || isOwner || isAdmin

  // Type assertion
  const analysisData = analysisRecord.full_critique as any 
  
  // JSON-LD Structured Data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
        '@type': 'ImageObject',
        name: analysisData.title,
        contentUrl: imageUrl || undefined,
        description: analysisData.description,
        author: {
            '@type': 'Person', // Assuming user photo
            name: 'Photographer'
        }
    },
    reviewRating: {
        '@type': 'Rating',
        ratingValue: analysisData.scores?.overall || analysisData.score,
        bestRating: 100,
        worstRating: 0
    },
    reviewBody: analysisData.preview_summary,
    author: {
        '@type': 'Organization',
        name: 'Snap Critique AI',
        url: process.env.NEXT_PUBLIC_SITE_URL
    },
    publisher: {
        '@type': 'Organization',
        name: 'Snap Critique',
        logo: {
            '@type': 'ImageObject',
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/icon.png`
        }
    }
  }

  const commentsResult = await supabase
    .from('comments')
    .select('*, profiles(full_name, avatar_url)')
    .eq('submission_id', id)
    .order('created_at', { ascending: true })

  let comments = commentsResult.data || []

  // Sign Avatar URLs for comments
  if (comments.length > 0) {
      comments = await Promise.all(comments.map(async (c: any) => {
          if (c.profiles?.avatar_url && !c.profiles.avatar_url.startsWith('http')) {
              const { data } = await supabase.storage
                  .from('submissions')
                  .createSignedUrl(c.profiles.avatar_url, 3600)
              if (data?.signedUrl) {
                  c.profiles.avatar_url = data.signedUrl
              }
          }
          return c
      }))
  }

  if (commentsResult.error) {
      console.error("[ResultsPage] Comment Fetch Error:", commentsResult.error)
  }

  console.log(`[ResultsPage] Fetched ${comments.length} comments for ${id}`)

  // 8. Auth for Comments (CurrentUser)
  // We already have `user` from auth.getUser(), but we might want profile info for the 'You' avatar if strictly needed.
  // For now, passing `user` object is enough for ID checks.
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
            {/* Only show share button if user is owner or admin */}
            {(isOwner || isAdmin) && (
              <ShareAnalysisDialog 
                submissionId={id} 
                initialIsPublic={!!analysisRecord.is_public}
              />
            )}
        </div>
        
        <AnalysisContainer 
            analysis={analysisData} 
            analysisId={id} 
            isUnlocked={isUnlocked} 
            imageUrl={imageUrl}
            userCredits={userCredits}
            isGuest={!user}
            metadata={submissionRecord.metadata}
            comments={comments || []}
            currentUser={user}
        />
      </div>
    </div>
  )
}
