import type { Metadata } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Snap Critique | AI Photography Analysis',
  description: 'AI-powered photography critique engine. Upload your shots for detailed analysis, composition scoring, and improvement checklists.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Snap Critique',
    description: 'Get a brutal, honest analysis of your photography.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground`} suppressHydrationWarning>
        <Header />
        {children}
      </body>
    </html>
  )
}
