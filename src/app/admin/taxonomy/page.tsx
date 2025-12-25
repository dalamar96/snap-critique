import { createAdminClient } from '@/lib/supabase/admin'
import { addBrand, deleteBrand, addType, deleteType } from './actions'
import { revalidatePath } from 'next/cache'
import { Trash2, Plus } from 'lucide-react'

export default async function TaxonomyPage() {
  const supabase = createAdminClient()

  const [brandsResult, typesResult] = await Promise.all([
      supabase.from('camera_brands').select('*').order('name'),
      supabase.from('photography_types').select('*').order('name')
  ])

  const brands = brandsResult.data || []
  const types = typesResult.data || []

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200 font-mono">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div>
           <h1 className="text-3xl font-bold text-white uppercase mb-2">Taxonomy Management</h1>
           <p className="text-slate-500">Manage valid Camera Brands and Photography Types for user profiles.</p>
        </div>

        {/* Brands Section */}
        <div className="bg-black border border-white/10 p-6">
            <h2 className="text-xl font-bold text-primary uppercase mb-4 border-b border-primary/20 pb-2">Camera Brands</h2>
            
            {/* Add Form */}
            <form action={async (formData) => {
                'use server'
                const name = formData.get('name') as string
                await addBrand(name)
            }} className="flex gap-2 mb-6">
                <input 
                    name="name" 
                    placeholder="New Brand (e.g. Hasselblad)" 
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                />
                <button type="submit" className="bg-primary text-black px-4 py-2 font-bold uppercase text-xs hover:bg-primary/80">
                    <Plus className="w-4 h-4" />
                </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {brands.map(brand => (
                    <div key={brand.id} className="flex items-center justify-between bg-white/5 px-3 py-2 border border-white/10">
                        <span className="text-sm">{brand.name}</span>
                        <form action={async () => {
                            'use server'
                            await deleteBrand(brand.id)
                        }}>
                             <button type="submit" className="text-slate-500 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                             </button>
                        </form>
                    </div>
                ))}
                {brands.length === 0 && <div className="text-slate-500 text-xs italic">No brands defined.</div>}
            </div>
        </div>

        {/* Types Section */}
        <div className="bg-black border border-white/10 p-6">
            <h2 className="text-xl font-bold text-primary uppercase mb-4 border-b border-primary/20 pb-2">Photography Types</h2>
            
             {/* Add Form */}
             <form action={async (formData) => {
                'use server'
                const name = formData.get('name') as string
                await addType(name)
            }} className="flex gap-2 mb-6">
                <input 
                    name="name" 
                    placeholder="New Type (e.g. Astro)" 
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                />
                <button type="submit" className="bg-primary text-black px-4 py-2 font-bold uppercase text-xs hover:bg-primary/80">
                    <Plus className="w-4 h-4" />
                </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {types.map(type => (
                    <div key={type.id} className="flex items-center justify-between bg-white/5 px-3 py-2 border border-white/10">
                        <span className="text-sm">{type.name}</span>
                        <form action={async () => {
                             'use server'
                             await deleteType(type.id)
                        }}>
                             <button type="submit" className="text-slate-500 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                             </button>
                        </form>
                    </div>
                ))}
                 {types.length === 0 && <div className="text-slate-500 text-xs italic">No types defined.</div>}
            </div>
        </div>

      </div>
    </div>
  )
}
