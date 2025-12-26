'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { X } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Small delay to prevent flashing on load
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h3 className="font-mono text-sm font-bold text-white">Cookie Policy</h3>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              We use cookies to improve your experience. By continuing to use our site, you agree to our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>.
            </p>

            <div className="flex gap-2">
              <button
                onClick={acceptCookies}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium py-2 px-4 rounded transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 text-xs font-medium py-2 px-4 rounded transition-colors border border-white/10"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
