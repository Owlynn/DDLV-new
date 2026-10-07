'use client'

import { useMemo } from 'react'
import { calendarMonths, dotColors, formatDay, getAgenda, todayKey } from '@/lib/formation-focus'
import { card, FocusLegend, FocusMonthGrid, StatusPill } from '@/components/eleve/ui'

export default function CalendrierFormationPage() {
  const today = todayKey()
  const agenda = useMemo(getAgenda, [])
  const next = agenda.find(item => item.date >= today)

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Calendrier de formation</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Formation Focus 2026-2027 · toutes les dates, d'octobre à juin</p>
      </div>

      <FocusLegend />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {calendarMonths.map(([year, monthIdx, label]) => {
          const prefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}-`
          const items = agenda.filter(item => item.date.startsWith(prefix))
          return (
            <section key={label} style={{ ...card, padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: '0 1 220px', minWidth: 200 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>{label}</h3>
                <FocusMonthGrid year={year} monthIdx={monthIdx} today={today} />
              </div>

              <ul style={{ flex: '1 1 280px', listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem', alignSelf: 'center' }}>
                {items.map(item => {
                  const past = item.date < today
                  const isNext = item === next
                  return (
                    <li key={`${item.date}-${item.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0.75rem', borderRadius: '0.6rem', background: isNext ? 'rgba(207,53,148,0.1)' : 'transparent', opacity: past ? 0.5 : 1 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColors[item.type], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', width: 112, flexShrink: 0, textTransform: 'capitalize' }}>
                        {formatDay(item.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ fontSize: '0.85rem', flex: 1, minWidth: 0 }}>{item.label}</span>
                      {isNext && <StatusPill tone="next">Prochaine date</StatusPill>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
