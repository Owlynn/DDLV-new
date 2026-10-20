'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { ConfirmDialog, IconButton, type ConfirmRequest, input, btnAccent, btnDanger, btnGhost } from '@/components/ManagerUI'
import { FOCUS_SEANCE_COLUMNS, PILIERS, toFocusSeance, type FocusSeance, type PilierKey } from '@/lib/focus-seances'
import { EXERCICE_COLUMNS, type Exercice } from '@/lib/suivi'

// Onglet « Préparation des séances Focus » de /admin : une séance = une date + un thème, et pour chaque pilier
// un texte et des exercices de la bibliothèque (public.exercices).
// Enregistrement automatique (debounce) dans focus_seances / focus_seance_piliers, tables réservées aux admins (RLS).

type Champ = 'date' | 'theme' | PilierKey
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Modification =
  | { seanceId: string; champ: Champ; valeur: string }
  | { seanceId: string; champ: 'exercices'; pilier: PilierKey; valeur: string[] }

const cleModification = (m: Modification) => (m.champ === 'exercices' ? `${m.seanceId}:exercices:${m.pilier}` : `${m.seanceId}:${m.champ}`)

const DEBOUNCE_MS = 700

// Couleurs de la marque, une par pilier
const PILIER_COLORS: Record<PilierKey, string> = {
  fondations: '#4db8c8',
  posture: '#c46bb5',
  collectif: '#e8789c',
  autonome: '#8b6fd1',
  scene: '#cf3594',
}

async function enregistrer(m: Modification) {
  // L'upsert ne touche que la colonne envoyée : le texte et les exercices d'un pilier s'enregistrent séparément
  const pilier: Record<string, unknown> | null = m.champ === 'exercices'
    ? { seance_id: m.seanceId, pilier: m.pilier, exercices: m.valeur }
    : m.champ !== 'date' && m.champ !== 'theme' ? { seance_id: m.seanceId, pilier: m.champ, contenu: m.valeur } : null
  const { data, error } = pilier
    ? await supabase.from('focus_seance_piliers').upsert(pilier, { onConflict: 'seance_id,pilier' }).select('id')
    : await supabase.from('focus_seances').update({ [m.champ]: m.valeur }).eq('id', m.seanceId).select('id')
  if (error) throw new Error(error.message)
  // Avec la RLS, un refus d'accès ne renvoie pas d'erreur mais aucune ligne
  if (!data?.length) throw new Error('séance introuvable ou accès refusé')
}

export default function FocusSeancesManager() {
  const [seances, setSeances] = useState<FocusSeance[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [adding, setAdding] = useState(false)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const [exercices, setExercices] = useState<Exercice[]>([])
  const selected = seances.find(s => s.id === selectedId) ?? null

  // Dernière valeur en attente pour chaque champ de chaque séance
  const pending = useRef(new Map<string, Modification>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Les enregistrements passent l'un après l'autre : une ancienne valeur ne peut pas écraser une plus récente
  const queue = useRef<Promise<void>>(Promise.resolve())
  const dateInputRef = useRef<HTMLInputElement>(null)

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const lot = [...pending.current.entries()]
    pending.current.clear()
    queue.current = queue.current.then(async () => {
      try {
        await Promise.all(lot.map(([, m]) => enregistrer(m)))
        if (!pending.current.size && !timer.current) setStatus(s => (s === 'saving' ? 'saved' : s))
      } catch (e) {
        // Remet en attente ce qui n'a pas été remplacé entre-temps : la prochaine saisie réessaiera
        for (const [key, m] of lot) if (!pending.current.has(key)) pending.current.set(key, m)
        setStatus('error')
        setError(`Enregistrement impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`)
      }
    })
    return queue.current
  }, [])

  useEffect(() => {
    async function load() {
      const [s, e] = await Promise.all([
        supabase.from('focus_seances').select(FOCUS_SEANCE_COLUMNS).order('ordre').order('created_at'),
        supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre'),
      ])
      if (s.error || e.error) setError(`Chargement impossible : ${(s.error ?? e.error)!.message}`)
      if (!s.error) {
        const list = (s.data ?? []).map(toFocusSeance)
        setSeances(list)
        setSelectedId(list[0]?.id ?? null)
      }
      setExercices((e.data ?? []) as Exercice[])
      setLoading(false)
    }
    load()
  }, [])

  // Enregistre ce qui reste en quittant l'onglet, et prévient si on ferme la page avant la fin
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size) { flush(); e.preventDefault() }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      flush()
    }
  }, [flush])

  function planifier(m: Modification, immediat = false) {
    pending.current.set(cleModification(m), m)
    setStatus('saving')
    setError('')
    if (timer.current) clearTimeout(timer.current)
    if (immediat) flush()
    else timer.current = setTimeout(flush, DEBOUNCE_MS)
  }

  function modifier(seanceId: string, champ: Champ, valeur: string) {
    setSeances(list => list.map(s => {
      if (s.id !== seanceId) return s
      return champ === 'date' || champ === 'theme' ? { ...s, [champ]: valeur } : { ...s, piliers: { ...s.piliers, [champ]: valeur } }
    }))
    planifier({ seanceId, champ, valeur })
  }

  // Ajout, retrait ou déplacement d'exercice : action ponctuelle, enregistrée tout de suite
  function modifierExercices(seanceId: string, pilier: PilierKey, valeur: string[]) {
    setSeances(list => list.map(s => (s.id === seanceId ? { ...s, exercices: { ...s.exercices, [pilier]: valeur } } : s)))
    planifier({ seanceId, champ: 'exercices', pilier, valeur }, true)
  }

  async function creerExercice(titre: string): Promise<Exercice | null> {
    const { data, error } = await supabase.from('exercices').insert({ titre }).select(EXERCICE_COLUMNS).single()
    if (error || !data) { setError(`Création de l'exercice impossible : ${error?.message ?? 'erreur inconnue'}`); return null }
    const exercice = data as Exercice
    setExercices(list => [...list, exercice].sort((a, b) => a.titre.localeCompare(b.titre, 'fr')))
    return exercice
  }

  async function ajouter() {
    setAdding(true)
    setError('')
    const ordre = Math.max(0, ...seances.map(s => s.ordre)) + 1
    const { data, error } = await supabase.from('focus_seances').insert({ date: '', theme: '', ordre }).select(FOCUS_SEANCE_COLUMNS).single()
    setAdding(false)
    if (error || !data) { setError(`Ajout impossible : ${error?.message ?? 'erreur inconnue'}`); return }
    const seance = toFocusSeance(data)
    setSeances(list => [...list, seance])
    setSelectedId(seance.id)
    requestAnimationFrame(() => dateInputRef.current?.focus())
  }

  function demanderSuppression(s: FocusSeance) {
    if (seances.length <= 1) return
    setConfirmReq({
      title: 'Supprimer cette séance ?',
      message: `La séance ${libelleSeance(s)} et ses notes pour les 5 piliers seront définitivement supprimées.`,
      onConfirm: async () => {
        for (const [key, m] of pending.current) if (m.seanceId === s.id) pending.current.delete(key)
        await queue.current
        const { data, error } = await supabase.from('focus_seances').delete().eq('id', s.id).select('id')
        if (error || !data?.length) { setError(`Suppression impossible : ${error?.message ?? 'accès refusé'}`); return }
        const index = seances.findIndex(x => x.id === s.id)
        const reste = seances.filter(x => x.id !== s.id)
        setSeances(reste)
        setSelectedId(reste[Math.min(index, reste.length - 1)]?.id ?? null)
      },
    })
  }

  return (
    <div className="focus-seances" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Préparation des séances Focus</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Le contenu de chaque séance, pilier par pilier. Enregistrement automatique.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <SaveIndicator status={status} />
          <button type="button" onClick={ajouter} disabled={adding || loading} style={{ ...btnAccent, opacity: adding || loading ? 0.6 : 1 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>add</span>
            {adding ? 'Ajout…' : 'Ajouter une séance'}
          </button>
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : !selected ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucune séance pour le moment. Commencez par « Ajouter une séance ».</p>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <SeancesList seances={seances} selectedId={selected.id} onSelect={setSelectedId} />
          <SeanceEditor
            key={selected.id}
            seance={selected}
            dateInputRef={dateInputRef}
            canDelete={seances.length > 1}
            onChange={(champ, valeur) => modifier(selected.id, champ, valeur)}
            onDelete={() => demanderSuppression(selected)}
            exercices={exercices}
            onExercicesChange={(pilier, ids) => modifierExercices(selected.id, pilier, ids)}
            onCreateExercice={creerExercice}
          />
        </div>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function libelleSeance(s: FocusSeance) {
  return s.date.trim() ? `du ${s.date.trim()}` : 'sans date'
}

/* ── Indicateur d'enregistrement ──────────────────────── */

function SaveIndicator({ status }: { status: SaveStatus }) {
  const view = {
    idle: null,
    saving: { icon: 'sync', label: 'Enregistrement…', color: 'rgba(255,255,255,0.55)' },
    saved: { icon: 'check_circle', label: 'Enregistré', color: '#4db8c8' },
    error: { icon: 'error', label: "Erreur d'enregistrement", color: '#f87171' },
  }[status]
  return (
    <span role="status" aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', minHeight: '1.25rem', fontSize: '0.8rem', color: view?.color }}>
      {view && (
        <>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>{view.icon}</span>
          {view.label}
        </>
      )}
    </span>
  )
}

/* ── Liste des séances (colonne sur ordinateur, bande horizontale sur mobile) ── */

function SeancesList({ seances, selectedId, onSelect }: { seances: FocusSeance[]; selectedId: string; onSelect: (id: string) => void }) {
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Garde la séance sélectionnée visible dans la bande horizontale
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selectedId])

  return (
    <nav aria-label="Séances" className="md:w-64 md:shrink-0">
      <ul className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {seances.map(s => {
          const active = s.id === selectedId
          return (
            <li key={s.id} className="shrink-0 w-44 md:w-auto">
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
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: active ? '#cf3594' : 'rgba(255,255,255,0.85)' }}>
                  {s.date.trim() || 'Sans date'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  {s.theme.trim() || 'Sans thème'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ── Éditeur de la séance sélectionnée ────────────────── */

const labelStyle: React.CSSProperties = { fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }

function SeanceEditor({ seance, dateInputRef, canDelete, onChange, onDelete, exercices, onExercicesChange, onCreateExercice }: {
  seance: FocusSeance
  dateInputRef: React.RefObject<HTMLInputElement | null>
  canDelete: boolean
  onChange: (champ: Champ, valeur: string) => void
  onDelete: () => void
  exercices: Exercice[]
  onExercicesChange: (pilier: PilierKey, ids: string[]) => void
  onCreateExercice: (titre: string) => Promise<Exercice | null>
}) {
  const id = (champ: Champ) => `focus-seance-${champ}`

  return (
    <section aria-label={`Séance ${libelleSeance(seance)}`} className="flex-1 min-w-0" style={{ ...card, padding: '1.5rem' }}>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor={id('date')} style={labelStyle}>Date</label>
          <input ref={dateInputRef} id={id('date')} value={seance.date} onChange={e => onChange('date', e.target.value)} placeholder="ex. 22/10" autoComplete="off" style={input} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
          <label htmlFor={id('theme')} style={labelStyle}>Thème</label>
          <input id={id('theme')} value={seance.theme} onChange={e => onChange('theme', e.target.value)} placeholder="Thème de la séance" autoComplete="off" style={input} />
        </div>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {PILIERS.map((p, i) => {
          const color = PILIER_COLORS[p.key]
          return (
            <li key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span aria-hidden="true" style={{ flexShrink: 0, width: '1.6rem', height: '1.6rem', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color, background: `${color}26`, border: `1px solid ${color}66` }}>
                  {i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor={id(p.key)} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{p.label}</label>
                  {p.sousTitre && <div id={`${id(p.key)}-aide`} style={{ fontSize: '0.75rem', color, marginTop: '0.15rem' }}>{p.sousTitre}</div>}
                </div>
              </div>
              <AutoTextarea
                id={id(p.key)}
                aria-describedby={p.sousTitre ? `${id(p.key)}-aide` : undefined}
                value={seance.piliers[p.key] ?? ''}
                onChange={v => onChange(p.key, v)}
                accent={color}
              />
              <ExercicesPilier
                idBase={id(p.key)}
                pilierLabel={p.label}
                selection={seance.exercices[p.key] ?? []}
                exercices={exercices}
                onChange={ids => onExercicesChange(p.key, ids)}
                onCreate={onCreateExercice}
              />
            </li>
          )
        })}
      </ol>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!canDelete && <span id="focus-seance-suppr-aide" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Au moins une séance doit rester.</span>}
        <button type="button" onClick={onDelete} disabled={!canDelete} aria-describedby={canDelete ? undefined : 'focus-seance-suppr-aide'} style={{ ...btnDanger, opacity: canDelete ? 1 : 0.4, cursor: canDelete ? 'pointer' : 'not-allowed' }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>delete</span>
          Supprimer la séance
        </button>
      </div>
    </section>
  )
}

/* ── Exercices d'un pilier : choix dans la bibliothèque ou création à la volée ── */

function ExercicesPilier({ idBase, pilierLabel, selection, exercices, onChange, onCreate }: {
  idBase: string
  pilierLabel: string
  selection: string[]
  exercices: Exercice[]
  onChange: (ids: string[]) => void
  onCreate: (titre: string) => Promise<Exercice | null>
}) {
  const [creating, setCreating] = useState(false)
  const [titre, setTitre] = useState('')
  const [busy, setBusy] = useState(false)
  const newInputRef = useRef<HTMLInputElement>(null)

  const titreOf = (exId: string) => exercices.find(e => e.id === exId)?.titre ?? 'Exercice supprimé'
  const available = exercices.filter(e => !selection.includes(e.id))

  function move(index: number, delta: number) {
    const list = [...selection]
    const [item] = list.splice(index, 1)
    list.splice(index + delta, 0, item)
    onChange(list)
  }

  async function create() {
    const t = titre.trim()
    if (!t || busy) return
    setBusy(true)
    const ex = await onCreate(t)
    setBusy(false)
    if (!ex) return
    onChange([...selection, ex.id])
    setTitre('')
    setCreating(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {selection.length > 0 && (
        <ol aria-label={`Exercices : ${pilierLabel}`} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {selection.map((exId, i) => (
            <li key={exId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>library_music</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titreOf(exId)}</span>
              <IconButton icon="arrow_upward" title={`Monter « ${titreOf(exId)} »`} disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="arrow_downward" title={`Descendre « ${titreOf(exId)} »`} disabled={i === selection.length - 1} onClick={() => move(i, 1)} />
              <IconButton icon="close" title={`Retirer « ${titreOf(exId)} »`} onClick={() => onChange(selection.filter(x => x !== exId))} />
            </li>
          ))}
        </ol>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {available.length > 0 && (
          <>
            <label htmlFor={`${idBase}-ajout-exercice`} className="sr-only">Ajouter un exercice : {pilierLabel}</label>
            <select
              id={`${idBase}-ajout-exercice`}
              value=""
              onChange={e => e.target.value && onChange([...selection, e.target.value])}
              style={{ ...input, flex: '1 1 220px', padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}
            >
              <option value="" style={{ background: '#1a0b2e' }}>+ Ajouter un exercice…</option>
              {available.map(e => <option key={e.id} value={e.id} style={{ background: '#1a0b2e' }}>{e.titre}</option>)}
            </select>
          </>
        )}
        {creating ? (
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 260px' }}>
            <label htmlFor={`${idBase}-nouvel-exercice`} className="sr-only">Titre du nouvel exercice : {pilierLabel}</label>
            <input
              ref={newInputRef}
              id={`${idBase}-nouvel-exercice`}
              value={titre}
              onChange={e => setTitre(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); create() }
                if (e.key === 'Escape') { setCreating(false); setTitre('') }
              }}
              placeholder="Titre du nouvel exercice"
              autoComplete="off"
              style={{ ...input, flex: 1, minWidth: 0, padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}
            />
            <button type="button" onClick={create} disabled={!titre.trim() || busy} style={{ ...btnGhost, padding: '0.45rem 0.8rem', fontSize: '0.8rem', opacity: titre.trim() && !busy ? 1 : 0.4 }}>
              {busy ? 'Création…' : 'Créer'}
            </button>
            <IconButton icon="close" title="Annuler" onClick={() => { setCreating(false); setTitre('') }} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setCreating(true); requestAnimationFrame(() => newInputRef.current?.focus()) }}
            style={{ ...btnGhost, padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>add</span>
            Nouvel exercice
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Zone de texte qui s'agrandit avec son contenu ────── */

function AutoTextarea({ id, value, onChange, accent, ...rest }: {
  id: string
  value: string
  onChange: (value: string) => void
  accent: string
  'aria-describedby'?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const ajuster = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px` // + les 2 px de bordure (box-sizing: border-box)
  }, [])

  useLayoutEffect(ajuster, [value, ajuster])
  useEffect(() => {
    window.addEventListener('resize', ajuster)
    return () => window.removeEventListener('resize', ajuster)
  }, [ajuster])

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      placeholder="Exercices, intentions, déroulé…"
      style={{ ...input, width: '100%', minHeight: '5.5rem', resize: 'none', overflow: 'hidden', lineHeight: 1.6, borderLeft: `3px solid ${accent}99` }}
      {...rest}
    />
  )
}
