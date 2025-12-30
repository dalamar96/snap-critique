import Link from 'next/link'
import { Camera } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-black py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-center">
          <div className="space-y-4 flex flex-col items-center">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors group">
                <div className="p-1.5 border border-white/20 rounded group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                    <Camera className="w-5 h-5 text-primary" />
                </div>
                <span className="font-mono font-bold uppercase tracking-widest text-sm">
                    Snap<span className="text-primary">Critique</span>
                </span>
            </Link>
            <p className="text-sm text-slate-400 font-mono leading-relaxed">
              AI-powered photography critique engine. Get professional-grade feedback instantly.
            </p>
            
            <a href="https://www.producthunt.com/products/snap-critique/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-snap-critique" target="_blank" className="hover:opacity-80 transition-opacity">
                <img 
                    src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1143009&theme=dark" 
                    alt="Snap Critique - Because &quot;looks fine&quot; isn&apos;t a plan | Product Hunt" 
                    style={{ width: '250px', height: '54px' }} 
                    width="250" 
                    height="54" 
                />
            </a>
          </div>
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/gallery" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  Explore Gallery
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm font-mono text-slate-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col items-center justify-center gap-4">
          <p className="text-xs text-slate-500 font-mono text-center">
            &copy; 2025 Beach Breeze Studios. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
