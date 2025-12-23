import { QuestionnaireWizard } from '@/components/wizard'
import { Suspense } from 'react'

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-tactical-grid flex flex-col items-center pt-24 pb-12 text-white">
      <div className="w-full max-w-2xl px-4 text-center mb-8">
        <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-white">Critique Setup</h1>
        <p className="text-slate-500 font-mono text-xs uppercase">Define your parameters.</p>
      </div>
      <Suspense fallback={<div className="text-primary font-mono animate-pulse">LOADING_MODULE...</div>}>
         <QuestionnaireWizard />
      </Suspense>
    </div>
  )
}
