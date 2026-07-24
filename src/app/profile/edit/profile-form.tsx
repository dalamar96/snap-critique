'use client'

import { useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Camera, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TaxonomyType {
    id: string
    name: string
    parent_id: string | null
    sort_order: number
}

interface ProfileData {
    avatar_url?: string | null
    is_public?: boolean | null
    full_name?: string | null
    business_name?: string | null
    website_url?: string | null
    bio?: string | null
    camera_brands?: string[] | null
    photography_types?: string[] | null
}

interface ProfileFormProps {
    user: SupabaseUser
    profile: ProfileData | null
    initialAvatarUrl: string
    availableBrands: string[]
    availableTypes: TaxonomyType[]
}

// Helper: Resize Image Client-Side
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale logic (contain)
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                // Force 512x512 if explicitly requested? OR just Max dimension?
                // User said "fit 512x512". Usually implies max dimension.
                // If they want SQUARE crop, that's different.
                // Assuming "resize to FIT within 512x512" to preserve aspect ratio, 
                // OR "resize/crop to exactly 512x512". 
                // Avatars are usually square. 
                // Let's do CENTER CROP to 512x512 (Square).

                const size = 512
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if(!ctx) { reject('No context'); return }

                // Center Crop Logic
                const scale = Math.max(size / img.width, size / img.height);
                const x = (size / 2) - (img.width / 2) * scale;
                const y = (size / 2) - (img.height / 2) * scale;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                canvas.toBlob((blob) => {
                    if(blob) resolve(blob)
                    else reject('Canvas to Blob failed')
                }, file.type, 0.9); // Quality 0.9
            };
            img.onerror = error => reject(error)
        };
        reader.onerror = error => reject(error);
    });
};

export function ProfileForm({ user, profile, initialAvatarUrl, availableBrands, availableTypes }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
    const [avatarPath, setAvatarPath] = useState(profile?.avatar_url || '')
    const [isPublic, setIsPublic] = useState(!!profile?.is_public)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!e.target.files || e.target.files.length === 0) {
                return
            }
            const originalFile = e.target.files[0]
            
            // Resize to 512x512 Square
            const resizedBlob = await resizeImage(originalFile, 512, 512)
            const file = new File([resizedBlob], originalFile.name, { type: originalFile.type })

            const fileExt = file.name.split('.').pop()
            // Format: ID_TIMESTAMP.ext (e.g. user123_17000000.jpg)
            const fileName = `${user.id}_${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`
            const supabase = createClient()

            // Upload to 'submissions' bucket (public-ish)
            const { error: uploadError } = await supabase.storage
                .from('submissions')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Determine Path or URL
            setAvatarPath(filePath)
            setAvatarUrl(URL.createObjectURL(file))
            
            // Immediately update Profile
            const { updateAvatar } = await import('../actions')
            await updateAvatar(filePath)

            toast.success("Avatar updated")
        } catch (error) {
            toast.error("Error uploading avatar")
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        
        // Ensure switch value is set
        formData.set('is_public', isPublic ? 'on' : 'off')

        // Ensure avatar path is set
        if (avatarPath) {
             formData.set('avatar_url', avatarPath)
        }

        const result = await updateProfile(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Profile updated")
            router.refresh()
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative bg-white/5 group">
                    {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                         <User className="w-8 h-8 text-slate-500" />
                    )}
                    {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white"/></div>}
                </div>
                <div>
                     <Label htmlFor="avatar-upload" className="btn-primary cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold text-black bg-primary hover:bg-primary/80 transition-colors rounded-sm">
                        <Camera className="w-4 h-4" />
                        {uploading ? "Uploading..." : "Change Photo"}
                     </Label>
                     <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                     />
                     <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Max 5MB. JPG/PNG.</p>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="full_name" defaultValue={profile?.full_name || ''} placeholder="Jane Doe" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                    <Label>Business Name <span className="text-slate-500 text-xs text-normal lowercase">(optional)</span></Label>
                    <Input name="business_name" defaultValue={profile?.business_name || ''} placeholder="Jane Doe Photography" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Website URL</Label>
                    <Input name="website_url" defaultValue={profile?.website_url || ''} placeholder="https://janedoe.com" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Bio</Label>
                    <Textarea name="bio" defaultValue={profile?.bio || ''} placeholder="Tell us about yourself..." className="bg-white/5 border-white/10 min-h-[100px]" />
                </div>
            </div>

            {/* Taxonomy */}
            <div className="space-y-6 pt-4 border-t border-white/10">
                <div className="space-y-3">
                    <Label className="text-base text-white font-bold uppercase">Camera Brands</Label>
                    <p className="text-xs text-slate-500">Select the brands you use.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableBrands.map(brand => (
                            <label key={brand} className="flex items-center gap-2 bg-white/5 p-3 border border-white/10 rounded cursor-pointer hover:border-primary/50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    name="brands" 
                                    value={brand}
                                    defaultChecked={profile?.camera_brands?.includes(brand)}
                                    className="accent-primary"
                                />
                                <span className="text-sm">{brand}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <Label className="text-base text-white font-bold uppercase">Photography Types</Label>
                    <p className="text-xs text-slate-500">Select your areas of focus.</p>
                    
                    <div className="space-y-8">
                        {/* Level 1: Categories */}
                        {availableTypes.filter(t => !t.parent_id).map(category => {
                            const subTypes = availableTypes.filter(t => t.parent_id === category.id)
                            
                            return (
                                <div key={category.id} className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-primary border-b border-white/10 pb-1 mb-2">
                                        {category.name}
                                    </h3>
                                    
                                    {/* Level 2: Sub-Categories or Items */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Direct Children */}
                                        {subTypes.map(sub => {
                                             // Check for Level 3 (Grandchildren)
                                             const grandChildren = availableTypes.filter(t => t.parent_id === sub.id)
                                             
                                             if (grandChildren.length > 0) {
                                                 return (
                                                     <div key={sub.id} className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 p-4 rounded-lg space-y-3">
                                                         <h4 className="text-xs font-bold text-slate-300 uppercase">{sub.name}</h4>
                                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {grandChildren.map(gc => (
                                                                <label key={gc.id} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        name="types" 
                                                                        value={gc.name} // Storing Name string
                                                                        defaultChecked={profile?.photography_types?.includes(gc.name)}
                                                                        className="accent-primary"
                                                                    />
                                                                    <span className="text-xs text-slate-400">{gc.name}</span>
                                                                </label>
                                                            ))}
                                                         </div>
                                                     </div>
                                                 )
                                             }

                                             // Standard Checkbox
                                             return (
                                                <label key={sub.id} className="flex items-center gap-2 bg-white/5 p-3 border border-white/10 rounded cursor-pointer hover:border-primary/50 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        name="types" 
                                                        value={sub.name} // Storing Name string
                                                        defaultChecked={profile?.photography_types?.includes(sub.name)}
                                                        className="accent-primary"
                                                    />
                                                    <span className="text-sm">{sub.name}</span>
                                                </label>
                                             )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded">
                <div>
                     <Label className="font-bold text-white uppercase">Public Profile</Label>
                     <p className="text-xs text-slate-500">Allow others to see your profile and gallery on the Community page.</p>
                </div>
                <Switch 
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    className="data-[state=checked]:bg-green-500"
                />
            </div>

            <div className="pt-4">
                 <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null }
                    Save Profile
                 </Button>
            </div>

        </form>
    )
}
