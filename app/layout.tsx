import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'LegitCheck PH — Check muna bago bayad',
  description: 'The Philippines\' anti-scam risk checker. Verify sellers, investments, donations, property deals, and job agencies before you pay.',
  keywords: ['anti-scam Philippines', 'legit check', 'scam checker', 'OFW scam', 'online seller legit', 'GCash scam'],
  authors: [{ name: 'LegitCheck PH' }],
  openGraph: {
    title: 'LegitCheck PH',
    description: 'Check muna bago bayad.',
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
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0B0D11',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  )
}
