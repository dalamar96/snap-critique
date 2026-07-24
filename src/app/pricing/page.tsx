import { createClient } from '@/lib/supabase/server'
import { PricingContent } from './pricing-content'

export const metadata = {
  title: 'Pricing - Snap Critique',
  description: 'Purchase credits for AI photography critiques.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <PricingContent user={user} />
}
