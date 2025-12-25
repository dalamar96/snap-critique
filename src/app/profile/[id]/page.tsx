import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Globe, Shield, Camera, Link as LinkIcon, MapPin, Grid, User } from 'lucide-react'
import Link from 'next/link'
import { GalleryItem } from '@/app/gallery/gallery-item'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('full_name, bio').eq('id', id).single()
    
    if (!profile) return { title: 'Profile Not Found' }
    
    return {
        title: `${profile.full_name || 'Photographer'} | Snap Critique`,
        description: profile.bio || 'Check out my photography portfolio on Snap Critique.',
    }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
     const supabase = createAdminClient()
     const authClient = await createClient()
     const { data: { user: currentUser } } = await authClient.auth.getUser()

     const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()


     if (!profile) return notFound()

     // Privacy Check
     const isOwner = currentUser?.id === profile.id
     const isAdmin = currentUser && (await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).single()).data?.is_admin

     if (!profile.is_public && !isOwner && !isAdmin) {
         return notFound() // Hide private profiles
     }

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
        .eq('submissions.user_id', id)
        .eq('is_public', true)
        .is('submissions.deleted_at', null)
        .order('created_at', { ascending: false })

    // Generate Signed URLs
    const galleryItems = await Promise.all(
        (analyses || []).map(async (item: any) => {
            let imageUrl = '/placeholder.png'
            if (item.submissions?.image_path) {
                 const previewPath = item.submissions.image_path.replace('uploads/', 'previews/')
                 const { data: previewData } = await supabase.storage.from('submissions').createSignedUrl(previewPath, 3600)
                 if (previewData?.signedUrl) imageUrl = previewData.signedUrl
                 else {
                     const { data: orig } = await supabase.storage.from('submissions').createSignedUrl(item.submissions.image_path, 3600)
                     if (orig?.signedUrl) imageUrl = orig.signedUrl
                 }
            }
            return {
                ...item,
                imageUrl,
                nsfw_score: item.full_critique?.nsfw_score,
                ai_generated_score: item.full_critique?.ai_generated_score
            }
        })
    )

    // Avatar Signed URL (if private bucket)
    // We stored path in avatar_url. 
    // If it starts with http, use it. Else sign it.
    // Avatar Signed URL
    let avatarSrc = profile.avatar_url
    if (profile.avatar_url && !profile.avatar_url.startsWith('http')) {
        const { data, error } = await supabase.storage.from('submissions').createSignedUrl(profile.avatar_url, 3600)
        if (error) console.error('Sign Error:', error)
        if (data?.signedUrl) {
            avatarSrc = data.signedUrl
        }
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Cover / Header Area */}
            <div className="bg-black/50 border-b border-white/10 pt-24 pb-12 px-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* Avatar */}
                    <div className="shrink-0 relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-2xl">
                             {avatarSrc ? (
                                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <User className="w-16 h-16" />
                                </div>
                             )}
                        </div>
                        {isOwner && (
                            <Link href="/profile/edit" className="absolute bottom-0 right-0 bg-primary text-black p-2 rounded-full border-4 border-slate-900 hover:bg-white transition-colors">
                                <Grid className="w-4 h-4" />
                            </Link>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">
                                    {profile.full_name || 'Photographer'}
                                </h1>
                                {profile.is_public && (
                                     <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded border border-green-500/20 uppercase font-bold tracking-wider">
                                        Public Profile
                                    </span>
                                )}
                            </div>
                            
                            {profile.business_name && (
                                <div className="text-slate-400 font-mono text-sm">{profile.business_name}</div>
                            )}
                        </div>

                        {profile.bio && (
                            <p className="text-slate-300 max-w-2xl leading-relaxed">{profile.bio}</p>
                        )}

                        <div className="flex flex-wrap gap-4 pt-2">
                             {profile.website_url && (
                                 <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-mono">
                                    <LinkIcon className="w-3 h-3" />
                                    {profile.website_url.replace(/^https?:\/\//, '')}
                                 </a>
                             )}
                        </div>

                         {/* Taxonomy Tags */}
                         <div className="flex flex-wrap gap-2 pt-2">
                            {profile.camera_brands?.map((brand: string) => (
                                <span key={brand} className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                                    <Camera className="w-3 h-3" /> {brand}
                                </span>
                            ))}
                            {profile.photography_types?.map((type: string) => (
                                <span key={type} className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                                    #{type}
                                </span>
                            ))}
                         </div>
                    </div>

                </div>
            </div>

            {/* Gallery Section */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                 <h2 className="text-2xl font-bold text-white uppercase mb-8 flex items-center gap-2">
                    <Grid className="w-6 h-6 text-primary" />
                    Portfolio
                </h2>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                    {galleryItems.map((item) => (
                        <GalleryItem key={item.id} item={{
                            id: item.id,
                            title: item.title,
                            score: item.score,
                            submission_id: item.submission_id,
                            imageUrl: item.imageUrl,
                            nsfw_score: item.nsfw_score,
                            ai_generated_score: item.ai_generated_score
                        }} />
                    ))}
                </div>
                 {galleryItems.length === 0 && (
                     <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-xl">
                         <p className="text-slate-500 uppercase tracking-widest text-sm">No public shots yet</p>
                     </div>
                 )}
            </div>
        </div>
    )
}
