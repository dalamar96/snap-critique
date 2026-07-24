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

        // 2. Upload Original
        const { error: originalError } = await supabase.storage
            .from('submissions')
            .upload(originalPath, file)

        if (originalError) throw originalError;

        // 3. Upload Preview
        const { error: previewError } = await supabase.storage
            .from('submissions')
            .upload(previewPath, previewBlob)

        if (previewError) {
            console.warn('Preview upload failed, but original succeeded:', previewError);
            // We continue even if preview fails fallback to original? 
            // Ideally we want both. But if preview fails, we might just use original.
        }

        return originalPath;
    } catch (error) {
        console.error('Error uploading file:', error instanceof Error ? error.message : error)
        return null
    }
}
