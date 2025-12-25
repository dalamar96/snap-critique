import { createAdminClient } from '@/lib/supabase/admin'
import { addBrand, deleteBrand, addType, deleteType } from './actions'
import { revalidatePath } from 'next/cache'
import { Trash2, Plus } from 'lucide-react'
import { TaxonomyTree } from './taxonomy-tree'

export default async function TaxonomyPage() {
  const supabase = createAdminClient()

  const [brandsResult, typesResult] = await Promise.all([
      supabase.from('camera_brands').select('*').order('name'),
      supabase.from('photography_types').select('id, name, parent_id, sort_order').order('sort_order', { ascending: true })
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
            <h2 className="text-xl font-bold text-primary uppercase mb-4 border-b border-primary/20 pb-2 flex justify-between items-center">
                Photography Types
                <form action={async () => {
                     'use server'
                     const { seedHierarchy } = await import('./actions')
                     await seedHierarchy()
                }}>
                    <button type="submit" className="text-xs bg-red-900/30 text-red-500 border border-red-900 px-2 py-1 uppercase font-bold hover:bg-red-900 hover:text-white transition-colors">
                        Reset & Seed Default
                    </button>
                </form>
            </h2>
            
             {/* Root Add Form */}
             <form action={async (formData) => {
                'use server'
                const name = formData.get('name') as string
                await addType(name)
            }} className="flex gap-2 mb-6">
                <input 
                    name="name" 
                    placeholder="New Root Category (e.g. Astro)" 
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                />
                <button type="submit" className="bg-primary text-black px-4 py-2 font-bold uppercase text-xs hover:bg-primary/80">
                    <Plus className="w-4 h-4" />
                </button>
            </form>

            <TaxonomyTree types={types} />
        </div>

      </div>
    </div>
  )
}
