import type { Metadata } from 'next'
import Link from 'next/link'
import SocialBar from '@/components/SocialBar'
import AteliersFormatPanel from '@/components/AteliersFormatPanel'
import WorkshopImage from '@/components/WorkshopImage'
import { Calendar, MapPin, ArrowRight, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Stages & Ateliers | Circlesongs & Improvisation Vocale | Toulouse',
  description: 'Stages et ateliers de circlesongs et improvisation vocale à Toulouse avec Donner de la Voix. Tous niveaux bienvenus.',
  alternates: { canonical: 'https://donnerdelavoix.fr/ateliers' },
}

function sanitizeExtId(extId: unknown): string {
  if (!extId || typeof extId !== 'string') return ''
  const trimmed = extId.trim()
  if (!trimmed) return ''
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return ''
  return trimmed
}

function formatDateFr(dateStr: string): { display: string; day: string; month: string } {
  const date = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(date.getTime())) return { display: dateStr, day: '?', month: '?' }
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()
  const display = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return { display, day, month }
}

type Workshop = {
  id: string | number
  title: string
  date: string | null
  dateDisplay: string
  day: string
  month: string
  time: string
  location: string
  image: string
  link: string
  description: string | null
}

async function getWorkshops(): Promise<Workshop[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://donnerdelavoix.fr'
    const res = await fetch(`${baseUrl}/api/billetweb`, { next: { revalidate: 900 } })
    if (!res.ok) return []
    const data = await res.json()
    const events: any[] = Array.isArray(data) ? data : (data.events || data.data || [])
    if (!Array.isArray(events)) return []

    const today = new Date(); today.setHours(0, 0, 0, 0)

    return events
      .map((event: any) => {
        const safeExtId = sanitizeExtId(event.ext_id)
        const startRaw = event.start || event.start_date || event.date || null
        const endRaw = event.end || event.end_date || null

        let dateStr: string | null = null
        let timeStr = 'Horaires à confirmer'

        if (startRaw) {
          const d = new Date(String(startRaw).replace(' ', 'T'))
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0]
            const h = String(d.getHours()).padStart(2, '0')
            const m = String(d.getMinutes()).padStart(2, '0')
            if (endRaw) {
              const de = new Date(String(endRaw).replace(' ', 'T'))
              if (!isNaN(de.getTime())) {
                timeStr = `${h}h${m}–${String(de.getHours()).padStart(2, '0')}h${String(de.getMinutes()).padStart(2, '0')}`
              } else { timeStr = `${h}h${m}` }
            } else { timeStr = `${h}h${m}` }
          }
        }

        const image = safeExtId
          ? `https://www.billetweb.fr/files/page/thumb/${safeExtId}.jpg`
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'

        const link = safeExtId
          ? `https://www.billetweb.fr/${safeExtId}`
          : (event.shop || event.url || event.booking_url || '#')

        const { display, day, month } = dateStr ? formatDateFr(dateStr) : { display: '', day: '?', month: '?' }

        return {
          id: event.id || Math.random(),
          title: event.name || event.title || 'Atelier sans titre',
          date: dateStr,
          dateDisplay: display,
          day,
          month,
          time: timeStr,
          location: event.place || event.location || event.address || event.venue || 'Toulouse',
          image,
          link,
          description: event.description || event.desc || null,
        }
      })
      .filter(w => {
        if (!w.date) return false
        return new Date(w.date) >= today
      })
      .sort((a, b) => {
        if (!a.date || !b.date) return 0
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
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
              <a href="#formats" className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                Les formats
              </a>
              <a href="#prochains" className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-[#cf3594]/70 bg-[#cf3594]/50 hover:bg-[#cf3594]/70 text-white transition-all">
                Prochaines dates
              </a>
            </nav>
          </div>
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            Des stages et ateliers de <strong>circlesongs</strong> et <strong>improvisation vocale</strong> à Toulouse. Tous niveaux bienvenus, aucun prérequis musical nécessaire.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-24">

        {/* Formats */}
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="formats">
          <h2 className="section-title-bentos">Formats d&apos;ateliers</h2>
          <AteliersFormatPanel />
        </section>

        {/* Prochains ateliers */}
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="prochains">
          <h2 className="section-title-bentos">Prochaines dates</h2>

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
              {workshops.map((w) => (
                <a
                  key={w.id}
                  href={w.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel-rose bento-tint-primary rounded-2xl flex flex-col relative overflow-hidden bento-content-glass transition-all hover:-translate-y-1"
                >
                  {/* Visuel avec médaillon date */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/50 to-accent/40">
                    <WorkshopImage src={w.image} alt={w.title} />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5b2ab5]/50 to-[#cf3594]/40 pointer-events-none" />
                    {/* Médaillon date */}
                    <div className="absolute top-3 left-3 w-14 h-14 rounded-full flex flex-col items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, rgba(91,42,181,0.95) 0%, rgba(207,53,148,0.95) 100%)', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
                      <span className="text-base font-bold leading-none">{w.day}</span>
                      <span className="text-xs font-semibold leading-none mt-0.5">{w.month}</span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <h3 className="text-base font-bold text-white leading-tight">{w.title}</h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4 shrink-0" />
                      {w.dateDisplay} · {w.time}
                    </p>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {w.location}
                    </p>
                    {w.description && (
                      <p className="text-white/90 text-sm mt-1 line-clamp-2">{w.description}</p>
                    )}
                    <span className="btn-rdv mt-auto inline-flex items-center gap-1 text-xs">
                      Voir &amp; s&apos;inscrire <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
