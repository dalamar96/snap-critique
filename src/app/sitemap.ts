import { createAdminClient } from '@/lib/supabase/admin'
import { MetadataRoute } from 'next'

export const revalidate = 0 // Revalidate immediately for fresh SEO

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createAdminClient()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapcritique.com'

    // Fetch all public analyses
    // We only want ones that are public and NOT soft-deleted
    const { data: analyses } = await supabase
        .from('analyses')
        .select(`
        submission_id,
        created_at,
        submissions!inner (
            deleted_at
        )
    `)
        .eq('is_public', true)
        .is('submissions.deleted_at', null)

    const analysisUrls = (analyses || []).map((analysis) => ({
        url: `${baseUrl}/analysis/${analysis.submission_id}`,
        lastModified: new Date(analysis.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/gallery`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        ...analysisUrls,
    ]
}
