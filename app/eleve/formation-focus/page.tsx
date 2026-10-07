'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  dotColors, formatDay, getDevoirs, getSessions, parseDay, todayKey, type FocusSession,
} from '@/lib/formation-focus'
import { card, SectionTitle, StatusPill } from '@/components/eleve/ui'

function formatSessionDates(s: FocusSession) {
  if (s.dates.length === 1) return formatDay(s.dates[0])
  return `${formatDay(s.dates[0], { weekday: 'long', day: 'numeric' })} et ${formatDay(s.dates[s.dates.length - 1])}`
}

function daysUntil(key: string, today: string) {
  return Math.round((parseDay(key).getTime() - parseDay(today).getTime()) / 86_400_000)
}

function relative(n: number) {
  return n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`
}

export default function FormationFocusElevePage() {
  const today = todayKey()
  const sessions = useMemo(getSessions, [])
  const devoirs = useMemo(getDevoirs, [])

  const isPast = (s: FocusSession) => s.dates[s.dates.length - 1] < today
  const nextSession = sessions.find(s => !isPast(s))
  const nextDevoir = devoirs.find(d => d.date >= today)
  const doneCount = sessions.filter(isPast).length

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Formation Focus 2026-2027</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Co-improvisation vocale & circlesong · d'octobre 2026 à juin 2027</p>
      </div>

      {/* ── À venir ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <HighlightCard
          icon="event"
          label="Prochaine séance"
          title={nextSession ? nextSession.label : 'Formation terminée 🎉'}
          detail={nextSession ? `${capitalize(formatSessionDates(nextSession))} · ${relative(daysUntil(nextSession.dates[0], today))}` : undefined}
          color={nextSession ? dotColors[nextSession.type] : '#cf3594'}
        />
        <HighlightCard
          icon="assignment"
          label="Prochain devoir à rendre"
          title={nextDevoir ? capitalize(formatDay(nextDevoir.date)) : 'Aucun devoir à venir'}
          detail={nextDevoir ? capitalize(relative(daysUntil(nextDevoir.date, today))) : undefined}
          color={dotColors.rendu}
        />
        <div style={card}>
          <CardLabel icon="trending_up">Progression</CardLabel>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{doneCount}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}> / {sessions.length}</span></div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0.4rem 0 0.8rem' }}>rendez-vous passés</div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${(doneCount / sessions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #5b2ab5, #cf3594)' }} />
          </div>
        </div>
      </div>

      {/* ── Suivi des séances ── */}
      <SectionTitle>Séances de l'année</SectionTitle>
      <div style={{ ...card, padding: 0, marginBottom: '2.5rem' }}>
        {sessions.map((s, i) => {
          const past = isPast(s)
          const next = s === nextSession
          return (
            <div key={s.dates[0]} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem 1.25rem', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none', background: next ? 'rgba(207,53,148,0.08)' : 'transparent', opacity: past ? 0.55 : 1 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColors[s.type], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>{capitalize(formatSessionDates(s))}</div>
              </div>
              <StatusPill tone={past ? 'done' : next ? 'next' : 'todo'}>{past ? 'Passée' : next ? 'Prochaine' : 'À venir'}</StatusPill>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {[
          { href: '/eleve/formation-focus/devoirs', icon: 'assignment', label: 'Voir les devoirs à rendre' },
          { href: '/eleve/formation-focus/suivi', icon: 'history_edu', label: 'Voir le suivi des séances' },
          { href: '/eleve/formation-focus/calendrier', icon: 'calendar_month', label: 'Voir le calendrier de formation' },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function CardLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.9rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
      {children}
    </div>
  )
}

function HighlightCard({ icon, label, title, detail, color }: { icon: string; label: string; title: string; detail?: string; color: string }) {
  return (
    <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
      <CardLabel icon={icon}>{label}</CardLabel>
      <div style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
      {detail && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem' }}>{detail}</div>}
    </div>
  )
}

