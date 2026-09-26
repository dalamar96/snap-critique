import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { DangerZone } from './danger-zone'
import { EmailPreferences } from './email-preferences'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminDb = createAdminClient()

  // Fetch all necessary data in parallel
  const [profileRes, brandsRes, typesRes] = await Promise.all([
      adminDb.from('profiles').select('*').eq('id', user.id).single(),
      adminDb.from('camera_brands').select('name').order('name'),
      adminDb.from('photography_types').select('id, name, parent_id, sort_order').order('sort_order', { ascending: true })
  ])

  const profile = profileRes.data
  const brands = (brandsRes.data || []).map(b => b.name)
  // Pass full types object, not just names
  const types = typesRes.data || []

  // Sign Avatar URL if needed
  let signedAvatarUrl = profile?.avatar_url || ''
  if (profile?.avatar_url && !profile.avatar_url.startsWith('http')) {
      const { data } = await supabase.storage.from('submissions').createSignedUrl(profile.avatar_url, 3600)
      if (data?.signedUrl) signedAvatarUrl = data.signedUrl
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-mono text-slate-200">
      <div className="max-w-2xl mx-auto">
         <h1 className="text-3xl font-bold text-white uppercase mb-8 pb-4 border-b border-white/10">Edit Profile</h1>
         
         <ProfileForm
            user={user}
            profile={profile}
            initialAvatarUrl={signedAvatarUrl}
            availableBrands={brands}
            availableTypes={types}
         />

         <EmailPreferences initialEnabled={!profile?.marketing_opt_out} />

         <DangerZone />
      </div>
    </div>
  )
}
