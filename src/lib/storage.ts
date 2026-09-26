import { createClient } from '@/lib/supabase/client'

import { createPreviewImage } from '@/lib/image';

export async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

    const originalPath = `uploads/${fileName}`
    const previewPath = `previews/${fileName}`

    try {
        // 1. Generate Preview
        const previewBlob = await createPreviewImage(file);

        // 2. Upload original and preview concurrently
        const [originalResult, previewResult] = await Promise.all([
            supabase.storage.from('submissions').upload(originalPath, file),
            supabase.storage.from('submissions').upload(previewPath, previewBlob),
        ])

        if (originalResult.error) throw originalResult.error;

        if (previewResult.error) {
            // Non-fatal: the analyze route falls back to the original.
            console.warn('Preview upload failed, but original succeeded:', previewResult.error);
        }

        return originalPath;
    } catch (error) {
        console.error('Error uploading file:', error instanceof Error ? error.message : error)
        return null
    }
}
