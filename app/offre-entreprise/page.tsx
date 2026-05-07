import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import { Users, Sparkles, Mic2, Briefcase, Target, Heart, ArrowRight, Calendar, MessageCircle, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Offres Entreprise | Cours de chant & Impro CE | Team building vocal',
  description: 'Cours de chant et d\'improvisation vocale pour entreprises et comités d\'entreprise. Team building vocal, ice breaker pour séminaires à Toulouse et ailleurs.',
  alternates: { canonical: 'https://donnerdelavoix.fr/offre-entreprise' },
}

export default function OffreEntreprisePage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12" aria-label="Hero">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5.8rem] lg:text-[7rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Offre</span>
              <span className="hero-gradient-word block">entreprise</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {[
                { href: '#pourquoi', label: 'Pourquoi l\'impro ?' },
                { href: '#formats', label: 'Les formats' },
                { href: '#contact', label: 'Nous contacter' },
              ].map((l) => (
                <a key={l.href} href={l.href} className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            L&apos;improvisation vocale au service de vos équipes. Team building vocal, animation de séminaire, ice breaker : des expériences qui créent de la connexion et libèrent la créativité.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-24">
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="pourquoi">
          <h2 className="section-title-bentos">Pourquoi l&apos;impro vocale en entreprise ?</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x2 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Building2 className="bento-icon" /></div>
              <p className="text-lg font-medium m-0">L&apos;improvisation vocale n&apos;est pas une activité de team building comme les autres. C&apos;est une expérience <strong>transformatrice</strong> qui touche à l&apos;essentiel : la communication, l&apos;écoute, la créativité et la confiance.</p>
              <p className="m-0 mt-2">Pas besoin de savoir chanter. Juste d&apos;être là, présent, et d&apos;oser.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Heart className="bento-icon" /></div>
              <h3>Ce que ça développe</h3>
              <ul className="text-sm mb-0 list-disc pl-4 space-y-1">
                <li>L&apos;écoute active</li>
                <li>La confiance en soi</li>
                <li>La cohésion d&apos;équipe</li>
                <li>La créativité et la spontanéité</li>
                <li>Le lâcher-prise</li>
                <li>La prise de risque positive</li>
              </ul>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" /></div>
              <h3>Pour tous</h3>
              <p className="mb-0 text-sm">Managers, équipes, dirigeants. Aucun prérequis musical.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sparkles className="bento-icon" /></div>
              <h3>Résultats immédiats</h3>
              <p className="mb-0 text-sm">Une expérience mémorable que les participants racontent longtemps après.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="formats">
          <h2 className="section-title-bentos">Les formats proposés</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Mic2 className="bento-icon" /></div>
              <h3>Ice breaker &amp; ouverture de séminaire</h3>
              <p className="m-0 text-sm"><strong>1h à 1h30</strong> — Parfait en début de journée ou de séminaire pour créer de la cohésion et de l&apos;énergie. Un moment fort qui brise les glaces et met tout le monde en mouvement.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Briefcase className="bento-icon" /></div>
              <h3>Atelier team building</h3>
              <p className="m-0 text-sm"><strong>2h à 3h</strong> — Une immersion plus profonde dans l&apos;improvisation vocale et les circlesongs. Les équipes créent de la musique ensemble, sans partition, en s&apos;écoutant et en se faisant confiance.</p>
              <h3 className="mt-4">Pour CE &amp; associations</h3>
              <p className="m-0 text-sm">Activité originale pour vos adhérents ou membres d&apos;équipe. Format adapté à votre contexte.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Target className="bento-icon" /></div>
              <h3>Sur mesure</h3>
              <p className="mb-0 text-sm">Chaque intervention est adaptée à vos objectifs, votre culture d&apos;entreprise et la taille du groupe.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-mix p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Calendar className="bento-icon" /></div>
              <p className="m-0 text-sm">Interventions possibles à <strong>Toulouse</strong> et partout en France (frais de déplacement en sus).</p>
              <Link href="/contact" className="btn-rdv mt-auto">Demander un devis</Link>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="contact">
          <h2 className="section-title-bentos">Discutons de votre projet</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden bento-content-glass text-center items-center justify-center">
              <div className="bento-icon-wrap"><MessageCircle className="bento-icon" /></div>
              <h3 className="text-lg">Vous avez un projet en tête ?</h3>
              <p className="mb-0 text-sm">Contactez-moi pour qu&apos;on discute de vos besoins, de la taille du groupe, du contexte. Je vous proposerai un format adapté et un devis.</p>
              <Link href="/contact" className="btn-rdv inline-flex items-center gap-2">
                Me contacter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <h3>À savoir</h3>
              <ul className="text-sm mb-0 list-disc pl-4 space-y-1">
                <li>Groupes de 6 à 50 personnes</li>
                <li>Aucun prérequis musical</li>
                <li>Matériel fourni si nécessaire</li>
                <li>Devis personnalisé sur demande</li>
              </ul>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <h3>Aussi pour les cours de chant en groupe</h3>
              <p className="m-0 text-sm">Vous souhaitez des cours de chant réguliers pour vos collaborateurs ou pour un CE ? C&apos;est possible !</p>
              <Link href="/cours-chant" className="btn-rdv mt-auto">Voir les cours de chant</Link>
            </div>
          </div>
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
