import { buildMonthCells, dateKey, dayLabels, dotColors, legend } from '@/lib/formation-focus'

// Briques visuelles partagées par les pages de l'espace élève.

export const card: React.CSSProperties = {
  borderRadius: '1rem',
  padding: '1.5rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(20px)',
  overflow: 'hidden',
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: '0.9rem' }}>{children}</h3>
}

export function StatusPill({ tone, children }: { tone: 'done' | 'next' | 'todo'; children: React.ReactNode }) {
  const styles = {
    done: { color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' },
    next: { color: '#cf3594', border: '1px solid rgba(207,53,148,0.5)', background: 'rgba(207,53,148,0.12)' },
    todo: { color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' },
  }[tone]
  return <span style={{ ...styles, fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{children}</span>
}

export function FocusLegend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
      {legend.map(l => (
        <span key={l.type} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColors[l.type] }} />
          {l.label}
        </span>
      ))}
    </div>
  )
}

/** Mini-calendrier d'un mois : jours de formation colorés, aujourd'hui entouré. */
export function FocusMonthGrid({ year, monthIdx, today }: { year: number; monthIdx: number; today: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
      {dayLabels.map((d, i) => (
        <span key={i} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{d}</span>
      ))}
      {buildMonthCells(year, monthIdx).map((cell, i) => {
        const isToday = cell.day !== null && dateKey(year, monthIdx, cell.day) === today
        return (
          <span key={i} style={{ fontSize: '0.7rem', lineHeight: '24px', height: 24, borderRadius: 6, color: cell.type ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: cell.type ? 600 : 400, background: cell.type ? `${dotColors[cell.type]}40` : 'transparent', boxShadow: isToday ? 'inset 0 0 0 1px #cf3594' : 'none' }}>
            {cell.day ?? ''}
          </span>
        )
      })}
    </div>
  )
}
