import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import FloatingRdv from '@/components/FloatingRdv'

export const metadata: Metadata = {
  metadataBase: new URL('https://donnerdelavoix.fr'),
  title: {
    default: 'Donner de la Voix – Circlesongs, chant & improvisation vocale | Toulouse',
    template: '%s | Donner de la Voix',
  },
  description: 'Circle song et circlesongs à Toulouse : ateliers d\'improvisation vocale, technique vocale, coach vocal. Donner de la Voix.',
  icons: { icon: '/assets/logo-ddlv.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css" />
      </head>
      <body className="font-display text-white h-screen overflow-hidden flex flex-col relative bg-deep-bg" suppressHydrationWarning>
        <div
          className="bg-blur-image"
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: -3, background: "url('/assets/bg.jpg') center center / cover no-repeat" }}
        />
        <div className="overlay-violet-gradient" aria-hidden="true" />
        <div id="bubbles-deco" aria-hidden="true">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="bubble-deco" />
          ))}
        </div>
        <Header />
        {children}
        <FloatingRdv />
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
