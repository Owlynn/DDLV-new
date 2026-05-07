'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import WorkshopImage from './WorkshopImage'

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

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function CalendarView({ workshops }: { workshops: Workshop[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const workshopsByDate = workshops.reduce<Record<string, Workshop[]>>((acc, w) => {
    if (!w.date) return acc
    acc[w.date] = [...(acc[w.date] || []), w]
    return acc
  }, {})

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="glass-panel-rose rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prev} className="size-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white border-0 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-white uppercase tracking-widest">{MONTHS_FR[month]} {year}</h3>
        <button type="button" onClick={next} className="size-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white border-0 cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/50 uppercase tracking-wide py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[3.5rem]" />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayWorkshops = workshopsByDate[dateStr] || []
          const hasWorkshop = dayWorkshops.length > 0
          const isToday = dateStr === today.toISOString().split('T')[0]

          return (
            <div
              key={i}
              className={`
                min-h-[3.5rem] rounded-lg p-1.5 flex flex-col gap-0.5 text-left
                ${hasWorkshop ? 'bg-white/8' : 'bg-white/5'}
                ${isToday ? 'ring-1 ring-white/40' : ''}
              `}
            >
              <span className={`text-[11px] font-semibold leading-none ${hasWorkshop ? 'text-white' : 'text-white/50'}`}>
                {day}
              </span>
              {dayWorkshops.map(w => (
                <a
                  key={w.id}
                  href={w.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded px-1 py-0.5 text-white no-underline hover:opacity-80 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(91,42,181,0.8) 0%, rgba(207,53,148,0.8) 100%)', fontSize: '9px', lineHeight: 1.3 }}
                  title={`${w.title} · ${w.time}`}
                >
                  <span className="block truncate font-semibold">{w.title}</span>
                  <span className="block truncate opacity-80">{w.time}</span>
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WorkshopsSection({ workshops }: { workshops: Workshop[] }) {
  const [view, setView] = useState<'cartes' | 'calendrier'>('cartes')

  if (workshops.length === 0) {
    return (
      <div className="glass-panel-rose bento-tint-primary rounded-2xl p-8 text-center bento-content-glass relative overflow-hidden">
        <div className="bento-icon-wrap justify-center"><Info className="bento-icon" /></div>
        <h3 className="text-xl font-bold text-white mb-2">Aucun atelier programmé pour l&apos;instant</h3>
        <p className="text-white/90 mb-4">De nouveaux ateliers sont régulièrement organisés. Inscrivez-vous à la newsletter pour ne rien manquer !</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/contact#newsletter" className="btn-rdv">S&apos;abonner à la newsletter</Link>
          <Link href="/contact" className="btn-rdv">Me contacter</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toggle — masqué sur mobile */}
      <div className="hidden lg:flex items-center gap-3 mb-4">
        <div className="inline-flex items-stretch p-1 rounded-2xl gap-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)' }}>
          {(['cartes', 'calendrier'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all border-0 cursor-pointer ${
                view === v
                  ? 'text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={view === v ? { background: 'linear-gradient(135deg, rgba(91,42,181,0.85) 0%, rgba(207,53,148,0.85) 100%)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 12px rgba(91,42,181,0.4)' } : {}}
            >
              <span className="material-symbols-outlined text-base">{v === 'cartes' ? 'grid_view' : 'calendar_month'}</span>
              Vue {v}
            </button>
          ))}
        </div>
      </div>

      {/* Vue cartes */}
      {(view === 'cartes') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workshops.map((w) => (
            <a
              key={w.id}
              href={w.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl flex flex-col transition-transform duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', minHeight: '280px' }}
            >
              {/* Visuel */}
              <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <WorkshopImage
                  src={w.image}
                  alt={w.title}
                  title={w.title}
                  dateDisplay={`${w.dateDisplay} · ${w.location}`}
                />
                {/* Médaillon date */}
                <div className="absolute top-3 left-3 w-14 h-14 rounded-full flex flex-col items-center justify-center text-white z-10"
                  style={{ background: 'linear-gradient(135deg, rgba(91,42,181,0.95) 0%, rgba(207,53,148,0.95) 100%)', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
                  <span className="text-base font-bold leading-none">{w.day}</span>
                  <span className="text-xs font-semibold leading-none mt-0.5">{w.month}</span>
                </div>
              </div>

              {/* Contenu : heure + lieu uniquement (titre déjà dans le gradient) */}
              <div className="p-4 flex flex-col gap-1.5 transition-[filter] duration-300 group-hover:blur-[3px]">
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {w.dateDisplay} · {w.time}
                </p>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {w.location}
                </p>
              </div>

              {/* Overlay au hover */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
                style={{ background: 'rgba(13,2,24,0.75)' }}
              >
                <span className="font-semibold text-sm uppercase tracking-widest text-white px-5 py-2 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.5)' }}>
                  Infos &amp; Inscriptions
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Vue calendrier — desktop uniquement */}
      {view === 'calendrier' && (
        <div className="hidden lg:block">
          <CalendarView workshops={workshops} />
        </div>
      )}
    </div>
  )
}
