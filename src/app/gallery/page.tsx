import { createAdminClient } from '@/lib/supabase/admin'
import { signPreviewUrls } from '@/lib/signed-urls'
import Link from 'next/link'
import { Camera, Search } from 'lucide-react'
import { GalleryItem } from './gallery-item'

export const metadata = {
  title: 'Explore | Snap Critique',
  description: 'Browse analyzed photos and see how AI breaks down composition, technique, and creativity.',
}

export const revalidate = 60 // Revalidate every minute

interface GalleryAnalysisRow {
  id: string
  title: string
  score: number
  submission_id: string
  full_critique: { nsfw_score?: number; ai_generated_score?: number } | null
  submissions: { id: string; image_path: string | null; deleted_at: string | null } | null
}

export default async function GalleryPage() {
  const supabase = createAdminClient()

  // Fetch Public Analyses
  const { data: analyses } = await supabase
    .from('analyses')
    .select(`
        id,
        title,
        score,
        submission_id,
        full_critique,
        submissions!inner (
            id,
            image_path,
            deleted_at
        )
    `)
    .eq('is_public', true)
    .is('submissions.deleted_at', null)
    .order('created_at', { ascending: false })
    // Cap the payload: unbounded lists + signing scale linearly with content.
    .limit(60)

  // Batch-sign all preview URLs (2 requests total instead of 1-2 per image).
  const rows = (analyses || []) as unknown as GalleryAnalysisRow[]
  const urls = await signPreviewUrls(supabase, rows, (item) => {
    const original = item.submissions?.image_path ?? null
    return { preview: original ? original.replace('uploads/', 'previews/') : null, original }
  })

  const galleryItems = rows.map((item, i) => ({
    ...item,
    imageUrl: urls[i] ?? '/placeholder.png',
    nsfw_score: item.full_critique?.nsfw_score, // Extract from JSONB
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Snap Critique Gallery',
    description: 'Explore AI-analyzed photography critiques.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery`,
    hasPart: galleryItems.map(item => ({
        '@type': 'Review',
        name: `Critique for ${item.title}`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/analysis/${item.submission_id}`,
        reviewRating: {
            '@type': 'Rating',
            ratingValue: item.score
        }
    }))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Header */}
        <div className="pt-24 pb-12 text-center container px-4 mx-auto">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-6 border border-primary/20">
                <Search className="w-3 h-3" />
                Community Showcase
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">Explore Community Critiques</h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
                See how others are improving their photography. Learn from their compositions, mistakes, and AI feedback.
            </p>
        </div>

        {/* Masonry Grid */}
        <div className="container px-4 mx-auto pb-24">
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {galleryItems.map((item) => (
                    <GalleryItem key={item.id} item={{
                        id: item.id,
                        title: item.title,
                        score: item.score,
                        submission_id: item.submission_id,
                        imageUrl: item.imageUrl,
                        nsfw_score: item.nsfw_score,
                        ai_generated_score: item.full_critique?.ai_generated_score
                    }} />
                ))}
            </div>

            {/* Empty State */}
            {galleryItems.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white uppercase mb-2">No Public Critiques Yet</h3>
                    <p className="text-slate-400 mb-6">Be the first to share your analysis with the world.</p>
                    <Link href="/" className="btn-primary py-3 px-6 text-sm">start an analysis</Link>
                </div>
            )}
        </div>
    </div>
  )
}
