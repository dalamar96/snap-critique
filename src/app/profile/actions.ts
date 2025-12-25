'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateAvatar(url: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const adminDb = createAdminClient()
    const { error } = await adminDb
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/profile/${user.id}`)
    revalidatePath('/profile/edit')
    revalidatePath('/community')

    return { success: true }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const fullName = formData.get('full_name') as string
    const businessName = formData.get('business_name') as string
    const websiteUrl = formData.get('website_url') as string
    const bio = formData.get('bio') as string
    const isPublic = formData.get('is_public') === 'on'

    // Arrays need JSON parsing or FormData handling
    // For simplicity, we will assume multi-selects submit multiple entries with same name? 
    // Or we handle client-side. Let's assume we receive a JSON string or handle getAll.

    // NOTE: FormData.getAll('brands') returns array of strings
    const brands = formData.getAll('brands') as string[]
    const types = formData.getAll('types') as string[]

    const adminDb = createAdminClient()

    const avatarUrl = formData.get('avatar_url') as string

    const updates = {
        full_name: fullName,
        business_name: businessName,
        website_url: websiteUrl,
        bio: bio,
        is_public: isPublic,
        camera_brands: brands,
        photography_types: types,
        avatar_url: avatarUrl // Add this line
    }

    const { error } = await adminDb
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/profile/${user.id}`)
    revalidatePath('/profile/edit')
    revalidatePath('/community')

    return { success: true }
}
