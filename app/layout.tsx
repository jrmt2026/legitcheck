import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import BottomNav from '@/components/BottomNav'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0D11',
}

export const metadata: Metadata = {
  title: 'LegitCheck PH — Check muna bago bayad',
  description: "The Filipino scam-safety companion before sending money. Paste a suspicious message, link, seller profile, or screenshot — LegitCheck PH checks for scam red flags before you pay.",
  keywords: [
    'anti-scam Philippines', 'legit check', 'scam checker PH',
    'OFW scam', 'online seller legit', 'GCash scam', 'smishing Philippines',
    'investment scam SEC', 'Facebook marketplace scam', 'MMDA SMS scam',
  ],
  authors: [{ name: 'LegitCheck PH' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LegitCheck PH',
  },
  openGraph: {
    title: 'LegitCheck PH — Check muna bago bayad',
    description: 'The Filipino scam-safety companion before sending money. Check muna bago bayad.',
    url: 'https://legitcheck.ph',
    siteName: 'LegitCheck PH',
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LegitCheck PH',
    description: 'Check muna bago bayad.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-paper-2 text-ink antialiased font-sans">
        {children}
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0B0D11',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#1A9968', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#C0312C', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
