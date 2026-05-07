import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import { Calendar, MapPin, Users, ArrowRight, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Stages & Ateliers | Circlesongs & Improvisation Vocale | Toulouse',
  description: 'Stages et ateliers de circlesongs et improvisation vocale à Toulouse avec Donner de la Voix. Tous niveaux bienvenus.',
  alternates: { canonical: 'https://donnerdelavoix.fr/ateliers' },
}

async function getWorkshops() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://donnerdelavoix.fr'
    const res = await fetch(`${baseUrl}/api/billetweb`, { next: { revalidate: 900 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function AteliersPage() {
  const workshops = await getWorkshops()

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12" aria-label="Hero">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5.8rem] lg:text-[7rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Stages &</span>
              <span className="hero-gradient-word block">ateliers</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              <a href="#prochains" className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                Prochains ateliers
              </a>
              <a href="#formats" className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                Les formats
              </a>
            </nav>
          </div>
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            Des stages et ateliers de <strong>circlesongs</strong> et <strong>improvisation vocale</strong> à Toulouse. Tous niveaux bienvenus, aucun prérequis musical nécessaire.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-24">
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="prochains">
          <h2 className="section-title-bentos">Prochains ateliers</h2>

          {workshops.length === 0 ? (
            <div className="glass-panel-rose bento-tint-primary rounded-2xl p-8 text-center bento-content-glass relative overflow-hidden">
              <div className="bento-icon-wrap justify-center"><Info className="bento-icon" /></div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun atelier programmé pour l&apos;instant</h3>
              <p className="text-white/90 mb-4">De nouveaux ateliers sont régulièrement organisés. Inscrivez-vous à la newsletter pour ne rien manquer !</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/contact#newsletter" className="btn-rdv">S&apos;abonner à la newsletter</Link>
                <Link href="/contact" className="btn-rdv">Me contacter</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workshops.map((w: any) => (
                <a
                  key={w.id}
                  href={w.url || w.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel-rose bento-tint-primary p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass transition-all hover:-translate-y-1"
                >
                  {w.image && (
                    <div className="aspect-[16/10] rounded-lg overflow-hidden relative">
                      <Image src={w.image} alt={w.name || 'Atelier'} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1">
                    <h3 className="text-lg font-bold text-white">{w.name || w.title}</h3>
                    {(w.start_date || w.date) && (
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <Calendar className="w-4 h-4 shrink-0" />
                        {w.start_date || w.date}
                      </p>
                    )}
                    {w.location && (
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {w.location}
                      </p>
                    )}
                    {w.description && (
                      <p className="text-white/90 text-sm mt-1 line-clamp-3">{w.description}</p>
                    )}
                  </div>
                  <span className="btn-rdv mt-auto inline-flex items-center gap-1 text-xs">
                    Voir &amp; s&apos;inscrire <ArrowRight className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="formats">
          <h2 className="section-title-bentos">Les formats d&apos;ateliers</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" /></div>
              <h3>Circlesongs</h3>
              <p className="m-0 text-sm">Un leader distribue des motifs vocaux aux participants. Les voix s&apos;assemblent en une polyphonie improvisée. Idéal pour découvrir l&apos;impro vocale en groupe.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Calendar className="bento-icon" /></div>
              <h3>Stages intensifs</h3>
              <p className="m-0 text-sm">Une journée complète ou un week-end d&apos;immersion dans l&apos;improvisation vocale. Idéal pour progresser rapidement et créer une véritable expérience de groupe.</p>
              <h3 className="mt-4">Ateliers réguliers</h3>
              <p className="m-0 text-sm">Des sessions récurrentes pour pratiquer et progresser dans la durée.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><MapPin className="bento-icon" /></div>
              <h3>Lieu</h3>
              <p className="mb-0 text-sm">Toulouse et région. Certains formats en extérieur.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-mix p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <p className="m-0 text-sm">Vous souhaitez être informé.e des prochains ateliers ?</p>
              <Link href="/contact#newsletter" className="btn-rdv mt-auto">S&apos;abonner à la newsletter</Link>
            </div>
          </div>
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
