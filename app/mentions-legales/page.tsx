import type { Metadata } from 'next'
import Link from 'next/link'
import SocialBar from '@/components/SocialBar'

export const metadata: Metadata = {
  title: 'Mentions légales | Donner de la Voix',
  description: 'Mentions légales du site Donner de la Voix - Éditeur, hébergeur, données personnelles et propriété intellectuelle.',
  alternates: { canonical: 'https://donnerdelavoix.fr/mentions-legales' },
}

export default function MentionsLegalesPage() {
  return (
    <main className="flex-1 overflow-y-auto relative pt-28 pb-24 px-4 md:px-8 max-w-4xl mx-auto" role="main">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight">
        <span className="hero-gradient-word">Mentions légales</span>
      </h1>

      <div className="flex flex-col gap-8">
        {[
          {
            title: 'Éditeur du site',
            content: (
              <>
                <p className="text-white/90">Donner de la Voix</p>
                <p className="text-white/90">Auto-entreprise – Jessalynn Choby</p>
                <p className="text-white/90">Toulouse, France</p>
                <p className="text-white/90">Contact : <a href="mailto:contact@donnerdelavoix.fr" className="text-accent underline">contact@donnerdelavoix.fr</a></p>
              </>
            ),
          },
          {
            title: 'Hébergement',
            content: (
              <>
                <p className="text-white/90">Ce site est hébergé par <strong>Vercel Inc.</strong></p>
                <p className="text-white/90">340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                <p className="text-white/90"><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">vercel.com</a></p>
              </>
            ),
          },
          {
            title: 'Propriété intellectuelle',
            content: (
              <p className="text-white/90">L&apos;ensemble des contenus présents sur ce site (textes, images, graphismes, logo) sont la propriété exclusive de Donner de la Voix, sauf mention contraire. Toute reproduction, représentation, modification ou adaptation, totale ou partielle, est interdite sans l&apos;autorisation préalable de l&apos;éditeur.</p>
            ),
          },
          {
            title: 'Données personnelles',
            content: (
              <>
                <p className="text-white/90">Les données collectées via le formulaire de contact (nom, email, message) sont utilisées uniquement pour répondre à vos demandes. Elles ne sont ni vendues, ni transmises à des tiers.</p>
                <p className="text-white/90">Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ce droit : <a href="mailto:contact@donnerdelavoix.fr" className="text-accent underline">contact@donnerdelavoix.fr</a></p>
              </>
            ),
          },
          {
            title: 'Cookies',
            content: (
              <p className="text-white/90">Ce site utilise des cookies techniques nécessaires à son fonctionnement (localStorage pour le cache des ateliers). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.</p>
            ),
          },
        ].map((section) => (
          <div key={section.title} className="glass-panel-rose rounded-2xl p-6 bento-tint-primary relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wide">{section.title}</h2>
            <div className="flex flex-col gap-2">{section.content}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center">
        <Link href="/" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors text-sm">
          ← Retour à l&apos;accueil
        </Link>
      </p>

      <SocialBar />
    </main>
  )
}
