'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function addBrand(name: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('camera_brands').insert({ name })
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    return { success: true }
}

export async function deleteBrand(id: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('camera_brands').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    return { success: true }
}

export async function addType(name: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('photography_types').insert({ name })
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    return { success: true }
}

export async function deleteType(id: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('photography_types').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    return { success: true }
}
