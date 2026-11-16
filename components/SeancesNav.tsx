'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildMonthCells, calendarMonths, dateKey, dayLabels, dotColors, formatDay, todayKey, type FocusEventType, type FocusSession } from '@/lib/formation-focus'
import { AVANCE_JOURS, ecartsCalendrier, seanceDates, seanceRemplie, type EcartsCalendrier, type FocusSeance, type SeancePrevue, type StatutSeance } from '@/lib/focus-seances'

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

/** Jours affichés dans les calendriers des séances : seulement les mercredis et les week-ends. */
function typeJour(t: FocusEventType | undefined) {
  return t === 'mercredi' || t === 'weekend' ? t : undefined
}

/**
 * Mise en page : en vue liste, la liste à gauche et la séance (children) à droite. En vue calendrier,
 * le calendrier prend toute la largeur ; un clic sur une séance le réduit à gauche et ouvre la séance à droite.
 */
export default function SeancesNav({ seances, selectedId, onSelect, showPublication = true, alertes = false, onCreate, children }: {
  seances: FocusSeance[]
  selectedId: string
  onSelect: (id: string) => void
  showPublication?: boolean
  /** Affiche les écarts avec le calendrier de la formation (admin). */
  alertes?: boolean
  /** Crée la séance d'une date du calendrier qui n'en a pas encore (admin). */
  onCreate?: (session: FocusSession) => void
  /** La séance sélectionnée. */
  children: React.ReactNode
}) {
  const [vue, setVue] = useState<Vue>('liste')
  const [ouvert, setOuvert] = useState(false) // vue calendrier : séance ouverte (calendrier réduit)
  useEffect(() => {
    try { if (localStorage.getItem(VUE_KEY) === 'calendrier') setVue('calendrier') } catch { /* stockage indisponible */ }
  }, [])
  function choisir(v: Vue) {
    setVue(v)
    setOuvert(false)
    try { localStorage.setItem(VUE_KEY, v) } catch { /* stockage indisponible */ }
  }
  const ouvrir = (id: string) => { onSelect(id); setOuvert(true) }
  const creer = onCreate && ((session: FocusSession) => { onCreate(session); setOuvert(true) })

  const today = todayKey()
  const ecarts = useMemo(() => ecartsCalendrier(seances, today), [seances, today])

  const bascule = (
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
  )

  if (vue === 'calendrier' && !ouvert) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '0.75rem' }}>
          {bascule}
          {alertes && <div style={{ flex: '1 1 280px', maxWidth: 520 }}><Alertes ecarts={ecarts} onSelect={ouvrir} onCreate={creer} /></div>}
        </div>
        <GrandCalendrier seances={seances} prevues={ecarts.prevues} selectedId={selectedId} onSelect={ouvrir} alertes={alertes} onCreate={creer} today={today} />
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:flex-row xl:items-start gap-4 xl:gap-6">
      <div className="xl:w-72 xl:shrink-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          {bascule}
          {vue === 'calendrier' && (
            <button type="button" onClick={() => setOuvert(false)} title="Afficher le calendrier en grand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' }}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>open_in_full</span>
              Agrandir
            </button>
          )}
        </div>

        {alertes && <Alertes ecarts={ecarts} onSelect={onSelect} onCreate={onCreate} />}

        {vue === 'liste' ? (
          <SeancesList seances={seances} selectedId={selectedId} onSelect={onSelect} showPublication={showPublication} alertes={alertes} />
        ) : (
          <SeancesCalendar seances={seances} prevues={ecarts.prevues} selectedId={selectedId} onSelect={onSelect} alertes={alertes} onCreate={onCreate} today={today} />
        )}
      </div>
      {children}
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

/* ── Vues calendrier : un mois à la fois, mercredis et week-ends colorés, séances cliquables ── */

interface CalendrierProps {
  seances: FocusSeance[]
  prevues: SeancePrevue[]
  selectedId: string
  onSelect: (id: string) => void
  alertes: boolean
  onCreate?: (session: FocusSession) => void
  today: string
}

function moisDe(key: string | undefined) {
  if (!key) return -1
  const [y, m] = key.split('-').map(Number)
  return calendarMonths.findIndex(([yy, mm]) => yy === y && mm === m - 1)
}

/** État commun aux deux calendriers : correspondances jour → séance, mois affiché. */
function useCalendrier({ seances, prevues, selectedId, today }: CalendrierProps) {
  // Jour → séance enregistrée ; jour → date prévue au calendrier (mercredi ou week-end)
  const parJour = useMemo(() => {
    const m = new Map<string, FocusSeance>()
    for (const s of seances) for (const d of seanceDates(s)) if (!m.has(d)) m.set(d, s)
    return m
  }, [seances])
  const prevueParJour = useMemo(() => new Map(prevues.flatMap(p => p.session.dates.map(d => [d, p] as const))), [prevues])
  const selected = seances.find(s => s.id === selectedId)
  const joursSelection = useMemo(() => new Set(selected ? seanceDates(selected) : []), [selected])

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
  return { parJour, prevueParJour, joursSelection, mois, setMois, year, monthIdx, label, prefix }
}

/** Ce qu'affiche et fait un jour du calendrier. */
function infoJour(key: string, type: FocusEventType | undefined, c: ReturnType<typeof useCalendrier>, p: CalendrierProps) {
  const seance = c.parJour.get(key) ?? null
  const prevue = c.prevueParJour.get(key) ?? null
  const statut: StatutSeance | null = seance ? (seanceRemplie(seance) ? 'prete' : 'vide') : prevue && p.alertes ? 'manquante' : null
  const action = seance ? () => p.onSelect(seance.id) : prevue && p.onCreate ? () => p.onCreate!(prevue.session) : undefined
  const titre = [
    formatDay(key),
    type ? prevue?.session.label ?? '' : '',
    seance ? `${seance.theme.trim() || 'Sans thème'}${p.alertes && statut === 'vide' ? ' (sans contenu)' : ''}` : statut === 'manquante' ? 'Pas de séance enregistrée — cliquer pour la créer' : '',
  ].filter(Boolean).join(' · ')
  return { seance, prevue, statut, action, titre, choisi: c.joursSelection.has(key) }
}

function MoisNav({ mois, setMois, label, grand = false }: { mois: number; setMois: (f: (m: number) => number) => void; label: string; grand?: boolean }) {
  const size = grand ? 36 : 30
  const navBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 999, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff' }
  const dernier = calendarMonths.length - 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: grand ? '1rem' : '0.6rem' }}>
      <button type="button" onClick={() => setMois(m => m - 1)} disabled={mois === 0} aria-label="Mois précédent" style={{ ...navBtn, opacity: mois === 0 ? 0.3 : 1 }}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>chevron_left</span>
      </button>
      <h3 aria-live="polite" style={{ fontSize: grand ? '1.15rem' : '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{label}</h3>
      <button type="button" onClick={() => setMois(m => m + 1)} disabled={mois === dernier} aria-label="Mois suivant" style={{ ...navBtn, opacity: mois === dernier ? 0.3 : 1 }}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>chevron_right</span>
      </button>
    </div>
  )
}

function Legende({ alertes }: { alertes: boolean }) {
  return (
    <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.8rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>
      {([['mercredi', 'Séance du mercredi'], ['weekend', 'Week-end']] as const).map(([t, l]) => (
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
  )
}

/** Grand calendrier, sur toute la largeur : le thème de chaque séance est écrit dans sa case. */
function GrandCalendrier(props: CalendrierProps) {
  const c = useCalendrier(props)
  const { alertes, today } = props
  const autres = props.seances.filter(s => seanceDates(s).length === 0)

  return (
    <div style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '1rem' }}>
      <MoisNav mois={c.mois} setMois={c.setMois} label={c.label} grand />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {dayLabels.map((d, i) => (
          <span key={i} aria-hidden="true" style={{ fontSize: '0.7rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', paddingBottom: 2 }}>{d}</span>
        ))}
        {buildMonthCells(c.year, c.monthIdx).map((cell, i) => {
          if (cell.day === null) return <span key={i} />
          const key = dateKey(c.year, c.monthIdx, cell.day)
          const type = typeJour(cell.type)
          const j = infoJour(key, type, c, props)
          const couleur = j.statut ? (alertes ? STATUT[j.statut].color : '#fff') : null
          const contenu = (
            <>
              <span style={{ fontSize: '0.8rem', fontWeight: type ? 700 : 400, color: type ? '#fff' : 'rgba(255,255,255,0.35)' }}>{cell.day}</span>
              {(j.seance || (alertes && j.statut === 'manquante')) && (
                <span className="hidden sm:flex" style={{ alignItems: 'flex-start', gap: '0.3rem', marginTop: '0.3rem', minWidth: 0, width: '100%' }}>
                  {couleur && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: couleur, flexShrink: 0, marginTop: '0.35rem' }} />}
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.72rem', lineHeight: 1.3, color: j.seance ? 'rgba(255,255,255,0.9)' : STATUT.manquante.color, fontStyle: j.seance ? 'normal' : 'italic', overflowWrap: 'anywhere' }}>
                    {j.seance ? (j.seance.theme.trim() || 'Sans thème') : 'À créer'}
                  </span>
                </span>
              )}
              {couleur && <span aria-hidden="true" className="sm:hidden" style={{ position: 'absolute', left: '50%', bottom: 5, transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: couleur }} />}
            </>
          )
          const style: React.CSSProperties = {
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 'clamp(52px, 11vw, 104px)', minWidth: 0,
            padding: '0.4rem 0.45rem', borderRadius: 10, border: 0, fontFamily: 'inherit', textAlign: 'left',
            background: type ? `${dotColors[type]}33` : 'rgba(255,255,255,0.02)',
            boxShadow: j.choisi ? 'inset 0 0 0 2px #cf3594' : key === today ? 'inset 0 0 0 1px rgba(255,255,255,0.6)' : 'none',
            cursor: j.action ? 'pointer' : 'default',
          }
          return j.action ? (
            <button key={i} type="button" onClick={j.action} title={j.titre} aria-label={j.titre} style={style}>{contenu}</button>
          ) : (
            <span key={i} title={j.titre || undefined} style={style}>{contenu}</span>
          )
        })}
      </div>

      <Legende alertes={alertes} />

      {autres.length > 0 && (
        <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>Sans date</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem' }}>
            {autres.map(s => (
              <li key={s.id} style={{ minWidth: 220 }}>
                <LigneMois date={null} seance={s} prevue={null} active={false} alertes={alertes} onClick={() => props.onSelect(s.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Petit calendrier, dans la colonne de gauche quand une séance est ouverte. */
function SeancesCalendar(props: CalendrierProps) {
  const { seances, prevues, selectedId, onSelect, alertes, onCreate, today } = props
  const c = useCalendrier(props)
  const { mois, setMois, year, monthIdx, label, prefix } = c

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

  return (
    <div style={{ borderRadius: '0.9rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '0.9rem', maxWidth: 420 }}>
      <MoisNav mois={mois} setMois={setMois} label={label} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
        {dayLabels.map((d, i) => (
          <span key={i} aria-hidden="true" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{d}</span>
        ))}
        {buildMonthCells(year, monthIdx).map((cell, i) => {
          if (cell.day === null) return <span key={i} />
          const key = dateKey(year, monthIdx, cell.day)
          const type = typeJour(cell.type)
          const j = infoJour(key, type, c, props)
          const style: React.CSSProperties = {
            position: 'relative', height: 34, borderRadius: 7, fontSize: '0.75rem', fontFamily: 'inherit', padding: 0,
            color: type ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: type ? 600 : 400,
            background: type ? `${dotColors[type]}40` : 'transparent',
            border: 0,
            boxShadow: j.choisi ? 'inset 0 0 0 2px #cf3594' : key === today ? 'inset 0 0 0 1px rgba(255,255,255,0.6)' : 'none',
            cursor: j.action ? 'pointer' : 'default',
          }
          const pastille = j.statut && (
            <span aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: 3, transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: alertes ? STATUT[j.statut].color : '#fff' }} />
          )
          return j.action ? (
            <button key={i} type="button" onClick={j.action} title={j.titre} aria-label={j.titre} aria-current={j.choisi ? 'true' : undefined} style={style}>
              {cell.day}{pastille}
            </button>
          ) : (
            <span key={i} title={j.titre || undefined} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cell.day}{pastille}
            </span>
          )
        })}
      </div>

      <Legende alertes={alertes} />

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
  const statut: StatutSeance = seance ? (seanceRemplie(seance) ? 'prete' : 'vide') : 'manquante'
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
