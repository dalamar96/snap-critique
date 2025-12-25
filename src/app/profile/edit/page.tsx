import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'

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
      adminDb.from('photography_types').select('name').order('name')
  ])

  const profile = profileRes.data
  const brands = (brandsRes.data || []).map(b => b.name)
  const types = (typesRes.data || []).map(t => t.name)

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-mono text-slate-200">
      <div className="max-w-2xl mx-auto">
         <h1 className="text-3xl font-bold text-white uppercase mb-8 pb-4 border-b border-white/10">Edit Profile</h1>
         
         <ProfileForm 
            user={user} 
            profile={profile} 
            availableBrands={brands} 
            availableTypes={types} 
         />
      </div>
    </div>
  )
}
