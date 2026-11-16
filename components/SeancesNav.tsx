'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildMonthCells, calendarMonths, dateKey, dayLabels, dotColors, formatDay, todayKey, type FocusSession } from '@/lib/formation-focus'
import { AVANCE_JOURS, ecartsCalendrier, seanceDates, seanceRemplie, type EcartsCalendrier, type FocusSeance, type SeancePrevue } from '@/lib/focus-seances'

// Navigation entre les séances Focus : vue liste ou vue calendrier (choix mémorisé dans le navigateur).
// Partagée par /admin → Préparation des séances (avec les alertes : écarts entre le calendrier de la formation,
// lib/formation-focus.ts, et les séances enregistrées) et par l'espace élève (sans alertes ni badge « Publiée »).

type Vue = 'liste' | 'calendrier'
const VUE_KEY = 'focus-seances-vue'

const STATUT = {
  prete: { color: '#4db8c8', label: 'Séance préparée' },
  vide: { color: '#f0a830', label: 'Séance sans contenu' },
  manquante: { color: '#f87171', label: 'Pas de séance enregistrée' },
} as const

export default function SeancesNav({ seances, selectedId, onSelect, showPublication = true, alertes = false, onCreate }: {
  seances: FocusSeance[]
  selectedId: string
  onSelect: (id: string) => void
  showPublication?: boolean
  /** Affiche les écarts avec le calendrier de la formation (admin). */
  alertes?: boolean
  /** Crée la séance d'une date du calendrier qui n'en a pas encore (admin). */
  onCreate?: (session: FocusSession) => void
}) {
  const [vue, setVue] = useState<Vue>('liste')
  useEffect(() => {
    try { if (localStorage.getItem(VUE_KEY) === 'calendrier') setVue('calendrier') } catch { /* stockage indisponible */ }
  }, [])
  function choisir(v: Vue) {
    setVue(v)
    try { localStorage.setItem(VUE_KEY, v) } catch { /* stockage indisponible */ }
  }

  const today = todayKey()
  const ecarts = useMemo(() => ecartsCalendrier(seances, today), [seances, today])

  return (
    <div className="xl:w-72 xl:shrink-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
      <div role="group" aria-label="Affichage des séances" style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: 3, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
        {([['liste', 'view_list', 'Liste'], ['calendrier', 'calendar_month', 'Calendrier']] as const).map(([v, icon, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => choisir(v)}
            aria-pressed={vue === v}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.8rem', borderRadius: 999, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', color: vue === v ? '#fff' : 'rgba(255,255,255,0.55)', background: vue === v ? 'rgba(207,53,148,0.3)' : 'transparent' }}
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {alertes && <Alertes ecarts={ecarts} onSelect={onSelect} onCreate={onCreate} />}

      {vue === 'liste' ? (
        <SeancesList seances={seances} selectedId={selectedId} onSelect={onSelect} showPublication={showPublication} alertes={alertes} />
      ) : (
        <SeancesCalendar seances={seances} prevues={ecarts.prevues} selectedId={selectedId} onSelect={onSelect} alertes={alertes} onCreate={onCreate} today={today} />
      )}
    </div>
  )
}

/* ── Alertes : calendrier de la formation vs séances enregistrées ── */

function Alertes({ ecarts, onSelect, onCreate }: {
  ecarts: EcartsCalendrier
  onSelect: (id: string) => void
  onCreate?: (session: FocusSession) => void
}) {
  const { aCompleter, horsCalendrier, sansDate } = ecarts
  const total = aCompleter.length + horsCalendrier.length + sansDate.length
  if (!total) return null

  const ligne: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem', lineHeight: 1.35, color: 'rgba(255,255,255,0.8)' }
  const action: React.CSSProperties = { flexShrink: 0, padding: '0.15rem 0.55rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)' }

  return (
    <details style={{ borderRadius: '0.75rem', border: '1px solid rgba(240,168,48,0.45)', background: 'rgba(240,168,48,0.1)', padding: '0.55rem 0.8rem' }}>
      <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#f0a830', listStyle: 'none' }}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>warning</span>
        {total} {total > 1 ? 'points à vérifier' : 'point à vérifier'}
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18, marginLeft: 'auto' }}>expand_more</span>
      </summary>

      <ul style={{ listStyle: 'none', margin: '0.6rem 0 0.1rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {aCompleter.map(p => (
          <li key={p.session.dates[0]} style={ligne}>
            <span style={{ minWidth: 0 }}>
              <span aria-hidden="true" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: STATUT[p.statut].color, marginRight: 6 }} />
              <strong style={{ fontWeight: 600 }}>{jourCourt(p.session.dates[0])}</strong>
              {' · '}{p.statut === 'manquante' ? 'pas de séance enregistrée' : 'séance sans contenu'}
            </span>
            {p.seance ? (
              <button type="button" onClick={() => onSelect(p.seance!.id)} style={action}>Ouvrir</button>
            ) : onCreate && (
              <button type="button" onClick={() => onCreate(p.session)} style={action}>Créer</button>
            )}
          </li>
        ))}
        {horsCalendrier.map(s => (
          <li key={s.id} style={ligne}>
            <span style={{ minWidth: 0 }}>« {s.date.trim()} » n’est pas une date du calendrier</span>
            <button type="button" onClick={() => onSelect(s.id)} style={action}>Ouvrir</button>
          </li>
        ))}
        {sansDate.map(s => (
          <li key={s.id} style={ligne}>
            <span style={{ minWidth: 0 }}>
              Séance {s.theme.trim() ? `« ${s.theme.trim()} » ` : ''}{s.date.trim() ? `à la date illisible « ${s.date.trim()} »` : 'sans date'}
            </span>
            <button type="button" onClick={() => onSelect(s.id)} style={action}>Ouvrir</button>
          </li>
        ))}
      </ul>
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
        Séances passées et des {AVANCE_JOURS} prochains jours. Toute l’année est visible dans la vue Calendrier.
      </p>
    </details>
  )
}

function jourCourt(key: string) {
  const s = formatDay(key, { weekday: 'short', day: 'numeric', month: 'short' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ── Vue liste (colonne sur ordinateur, bande horizontale sur mobile) ── */

function SeancesList({ seances, selectedId, onSelect, showPublication, alertes }: { seances: FocusSeance[]; selectedId: string; onSelect: (id: string) => void; showPublication: boolean; alertes: boolean }) {
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Garde la séance sélectionnée visible dans la bande horizontale
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selectedId])

  return (
    <nav aria-label="Séances">
      {/* Bande horizontale défilante jusqu'aux grands écrans, colonne à partir de xl */}
      <ul className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-visible p-0 pb-2 xl:pb-0" style={{ listStyle: 'none', margin: 0 }}>
        {seances.map(s => {
          const active = s.id === selectedId
          const vide = alertes && !seanceRemplie(s)
          return (
            <li key={s.id} className="shrink-0 w-44 xl:w-auto">
              <button
                ref={active ? selectedRef : undefined}
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={active ? 'true' : undefined}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', width: '100%',
                  padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  border: active ? '1px solid rgba(207,53,148,0.35)' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(207,53,148,0.12)' : 'rgba(255,255,255,0.04)',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: active ? '#cf3594' : 'rgba(255,255,255,0.85)' }}>
                    {s.date.trim() || 'Sans date'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {vide && (
                      <span title={STATUT.vide.label} className="material-symbols-outlined" style={{ fontSize: 16, color: STATUT.vide.color }}>
                        warning
                      </span>
                    )}
                    {showPublication && s.publiee && (
                      <span title="Visible par les élèves Focus" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4db8c8' }}>
                        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 13 }}>visibility</span>
                        Publiée
                      </span>
                    )}
                  </span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  {s.theme.trim() || 'Sans thème'}
                  {vide && <span className="sr-only"> · {STATUT.vide.label}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ── Vue calendrier : un mois à la fois, jours de formation colorés, séances cliquables ── */

function SeancesCalendar({ seances, prevues, selectedId, onSelect, alertes, onCreate, today }: {
  seances: FocusSeance[]
  prevues: SeancePrevue[]
  selectedId: string
  onSelect: (id: string) => void
  alertes: boolean
  onCreate?: (session: FocusSession) => void
  today: string
}) {
  // Jour → séance enregistrée ; jour → date prévue au calendrier (mercredi ou week-end)
  const parJour = useMemo(() => {
    const m = new Map<string, FocusSeance>()
    for (const s of seances) for (const d of seanceDates(s)) if (!m.has(d)) m.set(d, s)
    return m
  }, [seances])
  const prevueParJour = useMemo(() => new Map(prevues.flatMap(p => p.session.dates.map(d => [d, p] as const))), [prevues])
  const selected = seances.find(s => s.id === selectedId)
  const joursSelection = useMemo(() => new Set(selected ? seanceDates(selected) : []), [selected])

  const moisDe = (key: string | undefined) => {
    if (!key) return -1
    const [y, m] = key.split('-').map(Number)
    return calendarMonths.findIndex(([yy, mm]) => yy === y && mm === m - 1)
  }
  const [mois, setMois] = useState(() => {
    const i = moisDe(selected ? seanceDates(selected)[0] : undefined)
    if (i >= 0) return i
    const t = moisDe(today)
    return t >= 0 ? t : today < dateKey(calendarMonths[0][0], calendarMonths[0][1], 1) ? 0 : calendarMonths.length - 1
  })
  // Suit la séance choisie ailleurs (alertes, liens)
  useEffect(() => {
    const i = moisDe(selected ? seanceDates(selected)[0] : undefined)
    if (i >= 0) setMois(i)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [year, monthIdx, label] = calendarMonths[mois]
  const prefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}-`

  // Le détail du mois, en texte : dates prévues et séances enregistrées hors calendrier
  const lignes = useMemo(() => {
    const items: { key: string; date: string; seance: FocusSeance | null; prevue: SeancePrevue | null }[] = []
    for (const p of prevues) {
      if (!p.session.dates[0].startsWith(prefix)) continue
      if (!alertes && !p.seance) continue
      items.push({ key: p.session.dates[0], date: p.session.dates[0], seance: p.seance, prevue: p })
    }
    for (const s of seances) {
      const d = seanceDates(s).filter(x => x.startsWith(prefix))
      if (d.length && !items.some(i => i.seance?.id === s.id)) items.push({ key: s.id, date: d[0], seance: s, prevue: null })
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [prevues, seances, prefix, alertes])
  const autres = seances.filter(s => seanceDates(s).length === 0) // sans date lisible : hors calendrier

  const navBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff' }

  return (
    <div style={{ borderRadius: '0.9rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '0.9rem', maxWidth: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <button type="button" onClick={() => setMois(m => m - 1)} disabled={mois === 0} aria-label="Mois précédent" style={{ ...navBtn, opacity: mois === 0 ? 0.3 : 1 }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>chevron_left</span>
        </button>
        <h3 aria-live="polite" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{label}</h3>
        <button type="button" onClick={() => setMois(m => m + 1)} disabled={mois === calendarMonths.length - 1} aria-label="Mois suivant" style={{ ...navBtn, opacity: mois === calendarMonths.length - 1 ? 0.3 : 1 }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
        {dayLabels.map((d, i) => (
          <span key={i} aria-hidden="true" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{d}</span>
        ))}
        {buildMonthCells(year, monthIdx).map((cell, i) => {
          if (cell.day === null) return <span key={i} />
          const key = dateKey(year, monthIdx, cell.day)
          const seance = parJour.get(key)
          const prevue = prevueParJour.get(key)
          const statut = seance ? (seanceRemplie(seance) ? 'prete' : 'vide') : prevue && alertes ? 'manquante' : null
          const choisi = joursSelection.has(key)
          const action = seance ? () => onSelect(seance.id) : prevue && onCreate ? () => onCreate(prevue.session) : undefined
          const titre = [formatDay(key), cell.type && cell.type !== 'rendu' ? (prevue?.session.label ?? '') : cell.type === 'rendu' ? 'Rendu de devoir' : '',
            seance ? `${seance.theme.trim() || 'Sans thème'}${alertes && statut === 'vide' ? ' (sans contenu)' : ''}` : statut === 'manquante' ? 'Pas de séance enregistrée — cliquer pour la créer' : '']
            .filter(Boolean).join(' · ')
          const style: React.CSSProperties = {
            position: 'relative', height: 34, borderRadius: 7, fontSize: '0.75rem', fontFamily: 'inherit', padding: 0,
            color: cell.type ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: cell.type ? 600 : 400,
            background: cell.type ? `${dotColors[cell.type]}${cell.type === 'rendu' ? '22' : '40'}` : 'transparent',
            border: 0,
            boxShadow: choisi ? 'inset 0 0 0 2px #cf3594' : key === today ? 'inset 0 0 0 1px rgba(255,255,255,0.6)' : 'none',
            cursor: action ? 'pointer' : 'default',
          }
          const pastille = statut && (alertes || statut === 'prete' || statut === 'vide') && (
            <span aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: 3, transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: alertes ? STATUT[statut].color : '#fff' }} />
          )
          return action ? (
            <button key={i} type="button" onClick={action} title={titre} aria-label={titre} aria-current={choisi ? 'true' : undefined} style={style}>
              {cell.day}{pastille}
            </button>
          ) : (
            <span key={i} title={titre || undefined} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cell.day}{pastille}
            </span>
          )
        })}
      </div>

      {/* Légende */}
      <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.8rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>
        {([['mercredi', 'Mercredi'], ['weekend', 'Week-end'], ['soiree', 'Soirée publique']] as const).map(([t, l]) => (
          <li key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `${dotColors[t]}66` }} />{l}
          </li>
        ))}
        {alertes ? (['prete', 'vide', 'manquante'] as const).map(k => (
          <li key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUT[k].color }} />{STATUT[k].label}
          </li>
        )) : (
          <li style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />Séance disponible
          </li>
        )}
      </ul>

      {/* Le mois en texte */}
      {lignes.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0.9rem 0 0', padding: '0.75rem 0 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {lignes.map(l => (
            <li key={l.key}>
              <LigneMois
                date={l.date}
                seance={l.seance}
                prevue={l.prevue}
                active={!!l.seance && l.seance.id === selectedId}
                alertes={alertes}
                onClick={l.seance ? () => onSelect(l.seance!.id) : l.prevue && onCreate ? () => onCreate(l.prevue!.session) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {autres.length > 0 && (
        <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>Sans date</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {autres.map(s => (
              <li key={s.id}>
                <LigneMois date={null} seance={s} prevue={null} active={s.id === selectedId} alertes={alertes} onClick={() => onSelect(s.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function LigneMois({ date, seance, prevue, active, alertes, onClick }: {
  date: string | null
  seance: FocusSeance | null
  prevue: SeancePrevue | null
  active: boolean
  alertes: boolean
  onClick?: () => void
}) {
  const statut = seance ? (seanceRemplie(seance) ? 'prete' : 'vide') : 'manquante'
  const texte = seance ? (seance.theme.trim() || 'Sans thème') : 'Pas de séance enregistrée'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-current={active ? 'true' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.5rem', border: 0, cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left', background: active ? 'rgba(207,53,148,0.14)' : 'transparent' }}
    >
      {alertes && <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: STATUT[statut].color }} />}
      <span style={{ width: 74, flexShrink: 0, fontSize: '0.72rem', color: active ? '#cf3594' : 'rgba(255,255,255,0.55)' }}>
        {date ? jourCourt(date) : seance?.date.trim() || '—'}
      </span>
      <span style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: seance ? '#fff' : STATUT.manquante.color, fontStyle: seance ? 'normal' : 'italic' }}>
        {texte}
      </span>
      {alertes && !seance && prevue && onClick && (
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>add</span>
      )}
      {alertes && <span className="sr-only">{STATUT[statut].label}</span>}
    </button>
  )
}
