import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, User, ArrowRight } from 'lucide-react'

export const metadata = {
    title: 'Community | Snap Critique',
    description: 'Meet the photographers of Snap Critique.'
}

export const revalidate = 60

export default async function CommunityPage() {
    const supabase = createAdminClient()

    // Fetch Public Profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
    
    // Process Avatars
    const profilesWithAvatars = await Promise.all(
        (profiles || []).map(async (profile) => {
             let avatarSrc = profile.avatar_url
             if (profile.avatar_url && !profile.avatar_url.startsWith('http')) {
                 const { data } = await supabase.storage.from('submissions').createSignedUrl(profile.avatar_url, 3600)
                 if (data?.signedUrl) avatarSrc = data.signedUrl
             }
             return { ...profile, avatarSrc }
        })
    )

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
             <div className="pt-24 pb-12 text-center container px-4 mx-auto">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-6 border border-primary/20">
                    <Users className="w-3 h-3" />
                    Community
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">Photographer Directory</h1>
                <p className="text-slate-400 max-w-xl mx-auto text-lg">
                    Discover the artists behind the lens.
                </p>
            </div>

            <div className="container px-4 mx-auto pb-24 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {profilesWithAvatars.map(profile => (
                        <Link key={profile.id} href={`/profile/${profile.id}`} className="group block bg-black border border-white/10 hover:border-primary/50 transition-all rounded-xl overflow-hidden hover:-translate-y-1">
                            <div className="p-6 text-center">
                                {/* Avatar */}
                                <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border-2 border-white/10 mb-4 overflow-hidden relative">
                                     {profile.avatarSrc ? (
                                         <img src={profile.avatarSrc} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-slate-600">
                                             <User className="w-10 h-10" />
                                         </div>
                                     )}
                                </div>
                                
                                <h3 className="text-white font-bold uppercase text-lg mb-1 group-hover:text-primary transition-colors">{profile.full_name || 'Photographer'}</h3>
                                {profile.business_name && (
                                     <div className="text-slate-500 text-xs font-mono mb-3">{profile.business_name}</div>
                                )}

                                <p className="text-slate-400 text-sm line-clamp-2 min-h-[3rem] text-balance">
                                    {profile.bio || "No bio yet."}
                                </p>
                                
                                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-center">
                                     {profile.photography_types?.slice(0, 3).map((type: string) => (
                                         <span key={type} className="text-[9px] uppercase bg-white/5 px-2 py-1 rounded text-slate-500">
                                            {type}
                                         </span>
                                     ))}
                                     {(profile.photography_types?.length > 3) && (
                                         <span className="text-[9px] uppercase bg-white/5 px-2 py-1 rounded text-slate-500">
                                            +{profile.photography_types.length - 3}
                                         </span>
                                     )}
                                </div>
                            </div>
                            <div className="bg-white/5 py-2 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:bg-primary group-hover:text-black transition-colors flex items-center justify-center gap-2">
                                View Profile <ArrowRight className="w-3 h-3" />
                            </div>
                        </Link>
                    ))}
                </div>
                
                 {profilesWithAvatars.length === 0 && (
                     <div className="text-center py-20">
                         <p className="text-slate-500">No public profiles yet. Be the first!</p>
                     </div>
                 )}
            </div>
        </div>
    )
}
