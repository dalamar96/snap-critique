import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  const next = params.next || '/dashboard'

  if (user) {
    redirect(next)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading interface...</div>}>
         <LoginForm />
      </Suspense>
    </div>
  )
}
