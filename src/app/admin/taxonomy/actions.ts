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

export async function addType(name: string, parentId?: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('photography_types').insert({
        name,
        parent_id: parentId || null
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    revalidatePath('/profile/edit')
    return { success: true }
}

export async function deleteType(id: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('photography_types').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/taxonomy')
    return { success: true }
}
export async function seedHierarchy() {
    const supabase = createAdminClient()

    // 1. Clear existing
    await supabase.from('photography_types').delete().neq('name', '___') // Delete all

    // 2. The Data
    const data = {
        "photography_types": [
            { "id": 1, "name": "People", "slug": "people", "parentId": null, "sortOrder": 1 },

            { "id": 10, "name": "Portrait", "slug": "portrait", "parentId": 1, "sortOrder": 1 },
            { "id": 11, "name": "Headshot", "slug": "headshot", "parentId": 10, "sortOrder": 1 },
            { "id": 12, "name": "Environmental Portrait", "slug": "environmental-portrait", "parentId": 10, "sortOrder": 2 },
            { "id": 13, "name": "Studio Portrait", "slug": "studio-portrait", "parentId": 10, "sortOrder": 3 },
            { "id": 14, "name": "Lifestyle Portrait", "slug": "lifestyle-portrait", "parentId": 10, "sortOrder": 4 },
            { "id": 15, "name": "Candid Portrait", "slug": "candid-portrait", "parentId": 10, "sortOrder": 5 },

            { "id": 20, "name": "Family", "slug": "family", "parentId": 1, "sortOrder": 2 },
            { "id": 21, "name": "Couples", "slug": "couples", "parentId": 20, "sortOrder": 1 },
            { "id": 22, "name": "Engagement", "slug": "engagement", "parentId": 20, "sortOrder": 2 },
            { "id": 23, "name": "Maternity", "slug": "maternity", "parentId": 20, "sortOrder": 3 },
            { "id": 24, "name": "Newborn", "slug": "newborn", "parentId": 20, "sortOrder": 4 },

            { "id": 30, "name": "Wedding", "slug": "wedding", "parentId": 1, "sortOrder": 3 },
            { "id": 31, "name": "Bridal Portraits", "slug": "bridal-portraits", "parentId": 30, "sortOrder": 1 },
            { "id": 32, "name": "Ceremony", "slug": "ceremony", "parentId": 30, "sortOrder": 2 },
            { "id": 33, "name": "Reception", "slug": "reception", "parentId": 30, "sortOrder": 3 },
            { "id": 34, "name": "Detail Shots", "slug": "detail-shots", "parentId": 30, "sortOrder": 4 },

            { "id": 40, "name": "Boudoir", "slug": "boudoir", "parentId": 1, "sortOrder": 4 },
            { "id": 41, "name": "Classic Boudoir", "slug": "classic-boudoir", "parentId": 40, "sortOrder": 1 },
            { "id": 42, "name": "Artistic / Silhouette", "slug": "artistic-silhouette", "parentId": 40, "sortOrder": 2 },
            { "id": 43, "name": "Glamour", "slug": "glamour", "parentId": 40, "sortOrder": 3 },

            { "id": 50, "name": "Fashion", "slug": "fashion", "parentId": 1, "sortOrder": 5 },
            { "id": 51, "name": "Editorial Fashion", "slug": "editorial-fashion", "parentId": 50, "sortOrder": 1 },
            { "id": 52, "name": "Lookbook", "slug": "lookbook", "parentId": 50, "sortOrder": 2 },
            { "id": 53, "name": "Street Style", "slug": "street-style", "parentId": 50, "sortOrder": 3 },

            { "id": 60, "name": "Performance", "slug": "performance", "parentId": 1, "sortOrder": 6 },
            { "id": 61, "name": "Concert / Live Music", "slug": "concert-live-music", "parentId": 60, "sortOrder": 1 },
            { "id": 62, "name": "Theater / Stage", "slug": "theater-stage", "parentId": 60, "sortOrder": 2 },
            { "id": 63, "name": "Dance", "slug": "dance", "parentId": 60, "sortOrder": 3 },

            { "id": 70, "name": "Sports & Action", "slug": "sports-action", "parentId": 1, "sortOrder": 7 },
            { "id": 71, "name": "Field / Court Sports", "slug": "field-court-sports", "parentId": 70, "sortOrder": 1 },
            { "id": 72, "name": "Extreme Sports", "slug": "extreme-sports", "parentId": 70, "sortOrder": 2 },
            { "id": 73, "name": "Fitness", "slug": "fitness", "parentId": 70, "sortOrder": 3 },


            { "id": 2, "name": "Places & Travel", "slug": "places-travel", "parentId": null, "sortOrder": 2 },

            { "id": 100, "name": "Landscape", "slug": "landscape", "parentId": 2, "sortOrder": 1 },
            { "id": 101, "name": "Mountain", "slug": "mountain", "parentId": 100, "sortOrder": 1 },
            { "id": 102, "name": "Desert", "slug": "desert", "parentId": 100, "sortOrder": 2 },
            { "id": 103, "name": "Forest", "slug": "forest", "parentId": 100, "sortOrder": 3 },
            { "id": 104, "name": "Rural", "slug": "rural", "parentId": 100, "sortOrder": 4 },

            { "id": 110, "name": "Nature / Scenic", "slug": "nature-scenic", "parentId": 2, "sortOrder": 2 },
            { "id": 111, "name": "Seascape", "slug": "seascape", "parentId": 110, "sortOrder": 1 },
            { "id": 112, "name": "Waterfalls", "slug": "waterfalls", "parentId": 110, "sortOrder": 2 },
            { "id": 113, "name": "Storm / Weather", "slug": "storm-weather", "parentId": 110, "sortOrder": 3 },
            { "id": 114, "name": "Sunrise / Sunset", "slug": "sunrise-sunset", "parentId": 110, "sortOrder": 4 },

            { "id": 120, "name": "City & Urban", "slug": "city-urban", "parentId": 2, "sortOrder": 3 },
            { "id": 121, "name": "Cityscape", "slug": "cityscape", "parentId": 120, "sortOrder": 1 },
            { "id": 122, "name": "Street", "slug": "street", "parentId": 120, "sortOrder": 2 },
            { "id": 123, "name": "Urban Exploration", "slug": "urban-exploration", "parentId": 120, "sortOrder": 3 },
            { "id": 124, "name": "Architecture", "slug": "architecture", "parentId": 120, "sortOrder": 4 },

            { "id": 130, "name": "Travel", "slug": "travel", "parentId": 2, "sortOrder": 4 },
            { "id": 131, "name": "Travel Documentary", "slug": "travel-documentary", "parentId": 130, "sortOrder": 1 },
            { "id": 132, "name": "Cultural", "slug": "cultural", "parentId": 130, "sortOrder": 2 },
            { "id": 133, "name": "Travel Portraits", "slug": "travel-portraits", "parentId": 130, "sortOrder": 3 },

            { "id": 140, "name": "Aerial / Drone", "slug": "aerial-drone", "parentId": 2, "sortOrder": 5 },
            { "id": 141, "name": "Aerial Landscapes", "slug": "aerial-landscapes", "parentId": 140, "sortOrder": 1 },
            { "id": 142, "name": "Real Estate Aerial", "slug": "real-estate-aerial", "parentId": 140, "sortOrder": 2 },
            { "id": 143, "name": "Action Aerial", "slug": "action-aerial", "parentId": 140, "sortOrder": 3 },


            { "id": 3, "name": "Wildlife & Animals", "slug": "wildlife-animals", "parentId": null, "sortOrder": 3 },

            { "id": 200, "name": "Wildlife", "slug": "wildlife", "parentId": 3, "sortOrder": 1 },
            { "id": 201, "name": "Birds", "slug": "birds", "parentId": 200, "sortOrder": 1 },
            { "id": 202, "name": "Safari", "slug": "safari", "parentId": 200, "sortOrder": 2 },
            { "id": 203, "name": "Marine Wildlife", "slug": "marine-wildlife", "parentId": 200, "sortOrder": 3 },
            { "id": 204, "name": "Birds in Flight", "slug": "birds-in-flight", "parentId": 200, "sortOrder": 4 },

            { "id": 210, "name": "Pets", "slug": "pets", "parentId": 3, "sortOrder": 2 },
            { "id": 211, "name": "Pet Portrait", "slug": "pet-portrait", "parentId": 210, "sortOrder": 1 },
            { "id": 212, "name": "Action Pets", "slug": "action-pets", "parentId": 210, "sortOrder": 2 },

            { "id": 220, "name": "Equine", "slug": "equine", "parentId": 3, "sortOrder": 3 },


            { "id": 4, "name": "Objects & Products", "slug": "objects-products", "parentId": null, "sortOrder": 4 },

            { "id": 300, "name": "Product", "slug": "product", "parentId": 4, "sortOrder": 1 },
            { "id": 301, "name": "E-commerce / Catalog", "slug": "ecommerce-catalog", "parentId": 300, "sortOrder": 1 },
            { "id": 302, "name": "Advertising Product", "slug": "advertising-product", "parentId": 300, "sortOrder": 2 },
            { "id": 303, "name": "Packshots", "slug": "packshots", "parentId": 300, "sortOrder": 3 },

            { "id": 310, "name": "Food", "slug": "food", "parentId": 4, "sortOrder": 2 },
            { "id": 311, "name": "Restaurant", "slug": "restaurant", "parentId": 310, "sortOrder": 1 },
            { "id": 312, "name": "Recipe / Editorial", "slug": "recipe-editorial", "parentId": 310, "sortOrder": 2 },

            { "id": 320, "name": "Still Life", "slug": "still-life", "parentId": 4, "sortOrder": 3 },
            { "id": 321, "name": "Fine Art Still Life", "slug": "fine-art-still-life", "parentId": 320, "sortOrder": 1 },
            { "id": 322, "name": "Minimal Still Life", "slug": "minimal-still-life", "parentId": 320, "sortOrder": 2 },

            { "id": 330, "name": "Automotive", "slug": "automotive", "parentId": 4, "sortOrder": 4 },
            { "id": 331, "name": "Car Portraits", "slug": "car-portraits", "parentId": 330, "sortOrder": 1 },
            { "id": 332, "name": "Motorsport", "slug": "motorsport", "parentId": 330, "sortOrder": 2 },

            { "id": 340, "name": "Real Estate", "slug": "real-estate", "parentId": 4, "sortOrder": 5 },
            { "id": 341, "name": "Interiors", "slug": "interiors", "parentId": 340, "sortOrder": 1 },
            { "id": 342, "name": "Exteriors", "slug": "exteriors", "parentId": 340, "sortOrder": 2 },
            { "id": 343, "name": "Architectural Details", "slug": "architectural-details", "parentId": 340, "sortOrder": 3 },


            { "id": 5, "name": "Story & Events", "slug": "story-events", "parentId": null, "sortOrder": 5 },

            { "id": 400, "name": "Event", "slug": "event", "parentId": 5, "sortOrder": 1 },
            { "id": 401, "name": "Corporate", "slug": "corporate", "parentId": 400, "sortOrder": 1 },
            { "id": 402, "name": "Parties", "slug": "parties", "parentId": 400, "sortOrder": 2 },
            { "id": 403, "name": "Conferences", "slug": "conferences", "parentId": 400, "sortOrder": 3 },
            { "id": 404, "name": "Festivals", "slug": "festivals", "parentId": 400, "sortOrder": 4 },

            { "id": 410, "name": "Documentary", "slug": "documentary", "parentId": 5, "sortOrder": 2 },
            { "id": 411, "name": "Social Documentary", "slug": "social-documentary", "parentId": 410, "sortOrder": 1 },
            { "id": 412, "name": "Personal Projects", "slug": "personal-projects", "parentId": 410, "sortOrder": 2 },

            { "id": 420, "name": "Photojournalism", "slug": "photojournalism", "parentId": 5, "sortOrder": 3 },
            { "id": 421, "name": "News", "slug": "news", "parentId": 420, "sortOrder": 1 },
            { "id": 422, "name": "Editorial Coverage", "slug": "editorial-coverage", "parentId": 420, "sortOrder": 2 },

            { "id": 430, "name": "Editorial", "slug": "editorial", "parentId": 5, "sortOrder": 4 },
            { "id": 431, "name": "Magazine / Publication", "slug": "magazine-publication", "parentId": 430, "sortOrder": 1 },
            { "id": 432, "name": "Brand Editorial", "slug": "brand-editorial", "parentId": 430, "sortOrder": 2 },


            { "id": 6, "name": "Art & Experimental", "slug": "art-experimental", "parentId": null, "sortOrder": 6 },

            { "id": 500, "name": "Fine Art", "slug": "fine-art", "parentId": 6, "sortOrder": 1 },
            { "id": 501, "name": "Conceptual", "slug": "conceptual", "parentId": 500, "sortOrder": 1 },
            { "id": 502, "name": "Surreal", "slug": "surreal", "parentId": 500, "sortOrder": 2 },
            { "id": 503, "name": "Abstract", "slug": "abstract", "parentId": 500, "sortOrder": 3 },
            { "id": 504, "name": "Minimalist", "slug": "minimalist", "parentId": 500, "sortOrder": 4 },

            { "id": 510, "name": "Black & White", "slug": "black-and-white", "parentId": 6, "sortOrder": 2 },
            { "id": 520, "name": "Film / Analog", "slug": "film-analog", "parentId": 6, "sortOrder": 3 },
            { "id": 530, "name": "Infrared", "slug": "infrared", "parentId": 6, "sortOrder": 4 },

            { "id": 540, "name": "Astrophotography", "slug": "astrophotography", "parentId": 6, "sortOrder": 5 },
            { "id": 541, "name": "Milky Way", "slug": "milky-way", "parentId": 540, "sortOrder": 1 },
            { "id": 542, "name": "Star Trails", "slug": "star-trails", "parentId": 540, "sortOrder": 2 },
            { "id": 543, "name": "Deep Sky", "slug": "deep-sky", "parentId": 540, "sortOrder": 3 },

            { "id": 550, "name": "Long Exposure", "slug": "long-exposure", "parentId": 6, "sortOrder": 6 },
            { "id": 560, "name": "HDR", "slug": "hdr", "parentId": 6, "sortOrder": 7 },
            { "id": 570, "name": "Panorama", "slug": "panorama", "parentId": 6, "sortOrder": 8 },
            { "id": 580, "name": "Time-lapse", "slug": "time-lapse", "parentId": 6, "sortOrder": 9 },

            { "id": 590, "name": "Macro", "slug": "macro", "parentId": 6, "sortOrder": 10 },
            { "id": 591, "name": "Insects", "slug": "insects", "parentId": 590, "sortOrder": 1 },
            { "id": 592, "name": "Flowers", "slug": "flowers", "parentId": 590, "sortOrder": 2 },
            { "id": 593, "name": "Textures", "slug": "textures", "parentId": 590, "sortOrder": 3 },

            { "id": 600, "name": "Scientific / Technical", "slug": "scientific-technical", "parentId": 6, "sortOrder": 11 },
            { "id": 601, "name": "Medical", "slug": "medical", "parentId": 600, "sortOrder": 1 },
            { "id": 602, "name": "Laboratory", "slug": "laboratory", "parentId": 600, "sortOrder": 2 },
            { "id": 603, "name": "Industrial", "slug": "industrial", "parentId": 600, "sortOrder": 3 }
        ]
    }

    const { photography_types } = data

    // Map Old Int IDs to New UUIDs
    const idMap: Record<number, string> = {}

    // Sort: Parents first (parentId is null)
    // Actually, we must do level 0, then level 1, then level 2...
    // Let's do a multi-pass approach or just sort by parentId (nulls first) then ID?
    // User data is nicely ordered roughly.

    // 3. Insert Roots (Level 1)
    const roots = photography_types.filter(t => t.parentId === null)
    for (const root of roots) {
        const { data, error } = await supabase.from('photography_types').insert({
            name: root.name,
            slug: root.slug,
            sort_order: root.sortOrder,
            parent_id: null
        }).select('id').single()

        if (data && !error) {
            idMap[root.id] = data.id
        }
    }

    // 4. Insert Children (Level 2+)
    // Children might be Level 3 (grandkids), which depend on Level 2 IDs.
    // So we need to process layer by layer.
    // Simpler: Just loop until we've inserted everyone or made no progress.

    let remaining = photography_types.filter(t => t.parentId !== null)
    let loopGuard = 0
    while (remaining.length > 0 && loopGuard < 10) {
        const nextRemaining = []

        for (const item of remaining) {
            if (item.parentId && idMap[item.parentId]) {
                // Parent exists in DB
                const { data, error } = await supabase.from('photography_types').insert({
                    name: item.name,
                    slug: item.slug,
                    sort_order: item.sortOrder,
                    parent_id: idMap[item.parentId]
                }).select('id').single()

                if (data && !error) {
                    idMap[item.id] = data.id
                }
            } else {
                nextRemaining.push(item)
            }
        }
        remaining = nextRemaining
        loopGuard++
    }

    revalidatePath('/admin/taxonomy')
    return { success: true, seeded: Object.keys(idMap).length }
}
