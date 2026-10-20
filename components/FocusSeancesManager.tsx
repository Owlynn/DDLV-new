'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { ConfirmDialog, IconButton, Modal, type ConfirmRequest, input, btnAccent, btnDanger, btnGhost } from '@/components/ManagerUI'
import { ExerciceForm } from '@/components/ExercicesManager'
import { DevoirForm, emptyDraft, type DevoirDraft } from '@/components/DevoirsManager'
import { FOCUS_SEANCE_ADMIN_COLUMNS, PILIERS, PILIER_COLORS, toFocusSeance, type FocusSeance, type NoteKey, type PilierKey } from '@/lib/focus-seances'
import { FOCUS_TAG, formatDay } from '@/lib/formation-focus'
import { DEVOIR_COLUMNS, hasContent, type Devoir } from '@/lib/devoirs'
import { EXERCICE_COLUMNS, fetchNotions, type Exercice, type Notion } from '@/lib/suivi'

// Onglet « Préparation des séances Focus » de /admin : une séance = une date + un thème, et pour chaque pilier
// un texte et des exercices de la bibliothèque (public.exercices).
// Enregistrement automatique (debounce) dans focus_seances / focus_seance_piliers. Les admins gèrent tout (RLS) ;
// une séance publiée est lisible par les élèves Focus (components/eleve/FocusSeancesEleve.tsx).

type Champ = 'date' | 'theme' | PilierKey
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Modification =
  | { seanceId: string; champ: Champ; valeur: string }
  | { seanceId: string; champ: 'exercices'; pilier: PilierKey; valeur: string[] }
  | { seanceId: string; champ: 'publiee'; valeur: boolean }
  | { seanceId: string; champ: 'notes'; pilier: NoteKey; valeur: string }

const cleModification = (m: Modification) => (m.champ === 'exercices' || m.champ === 'notes' ? `${m.seanceId}:${m.champ}:${m.pilier}` : `${m.seanceId}:${m.champ}`)

const DEBOUNCE_MS = 700

async function enregistrer(m: Modification) {
  // L'upsert ne touche que la colonne envoyée : le texte et les exercices d'un pilier s'enregistrent séparément
  const upsert = (table: string, row: Record<string, unknown>) =>
    supabase.from(table).upsert({ seance_id: m.seanceId, ...row }, { onConflict: 'seance_id,pilier' }).select('id')
  const { data, error } =
    m.champ === 'notes' ? await upsert('focus_seance_notes', { pilier: m.pilier, notes: m.valeur })
    : m.champ === 'exercices' ? await upsert('focus_seance_piliers', { pilier: m.pilier, exercices: m.valeur })
    : m.champ === 'date' || m.champ === 'theme' || m.champ === 'publiee'
      ? await supabase.from('focus_seances').update({ [m.champ]: m.valeur }).eq('id', m.seanceId).select('id')
      : await upsert('focus_seance_piliers', { pilier: m.champ, contenu: m.valeur })
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
  const [notions, setNotions] = useState<Notion[]>([])
  const [editingExo, setEditingExo] = useState<Exercice | null>(null)
  const [devoirs, setDevoirs] = useState<Devoir[]>([]) // devoirs Focus, rattachés ou non à une séance
  const [editingDevoir, setEditingDevoir] = useState<DevoirDraft | null>(null)
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
      const [s, e, n, d] = await Promise.all([
        supabase.from('focus_seances').select(FOCUS_SEANCE_ADMIN_COLUMNS).order('ordre').order('created_at'),
        supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre'),
        fetchNotions(),
        supabase.from('devoirs').select(DEVOIR_COLUMNS).eq('contexte', FOCUS_TAG).order('date_limite'),
      ])
      setNotions(n)
      setDevoirs((d.data ?? []) as Devoir[])
      const loadError = s.error ?? e.error ?? d.error
      if (loadError) setError(`Chargement impossible : ${loadError.message}`)
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

  function modifierNotes(seanceId: string, pilier: NoteKey, valeur: string) {
    setSeances(list => list.map(s => (s.id === seanceId ? { ...s, notes: { ...s.notes, [pilier]: valeur } } : s)))
    planifier({ seanceId, champ: 'notes', pilier, valeur })
  }

  function modifierPublication(seanceId: string, publiee: boolean) {
    setSeances(list => list.map(s => (s.id === seanceId ? { ...s, publiee } : s)))
    planifier({ seanceId, champ: 'publiee', valeur: publiee }, true)
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
    const { data, error } = await supabase.from('focus_seances').insert({ date: '', theme: '', ordre }).select(FOCUS_SEANCE_ADMIN_COLUMNS).single()
    setAdding(false)
    if (error || !data) { setError(`Ajout impossible : ${error?.message ?? 'erreur inconnue'}`); return }
    const seance = toFocusSeance(data)
    setSeances(list => [...list, seance])
    setSelectedId(seance.id)
    requestAnimationFrame(() => dateInputRef.current?.focus())
  }

  async function rechargerExercices() {
    const { data, error } = await supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre')
    if (error) setError(`Rechargement des exercices impossible : ${error.message}`)
    else setExercices((data ?? []) as Exercice[])
  }

  async function rechargerDevoirs() {
    const { data, error } = await supabase.from('devoirs').select(DEVOIR_COLUMNS).eq('contexte', FOCUS_TAG).order('date_limite')
    if (error) setError(`Rechargement des devoirs impossible : ${error.message}`)
    else setDevoirs((data ?? []) as Devoir[])
  }

  // Rattache un devoir existant à la séance, ou l'en détache (seanceId = null) : le devoir lui-même est conservé
  async function rattacherDevoir(devoirId: string, seanceId: string | null) {
    setError('')
    const { data, error } = await supabase.from('devoirs').update({ seance_id: seanceId }).eq('id', devoirId).select('id')
    if (error || !data?.length) { setError(`Modification du devoir impossible : ${error?.message ?? 'accès refusé'}`); return }
    setDevoirs(list => list.map(d => (d.id === devoirId ? { ...d, seance_id: seanceId } : d)))
  }

  function demanderSuppression(s: FocusSeance) {
    if (seances.length <= 1) return
    setConfirmReq({
      title: 'Supprimer cette séance ?',
      message: `La séance ${libelleSeance(s)} , son contenu pour les 5 piliers et toutes ses notes privées seront définitivement supprimés.`
        + (devoirs.some(d => d.seance_id === s.id) ? '\nSes devoirs à rendre sont conservés, sans séance.' : ''),
      onConfirm: async () => {
        for (const [key, m] of pending.current) if (m.seanceId === s.id) pending.current.delete(key)
        await queue.current
        const { data, error } = await supabase.from('focus_seances').delete().eq('id', s.id).select('id')
        if (error || !data?.length) { setError(`Suppression impossible : ${error?.message ?? 'accès refusé'}`); return }
        const index = seances.findIndex(x => x.id === s.id)
        const reste = seances.filter(x => x.id !== s.id)
        setSeances(reste)
        setDevoirs(list => list.map(d => (d.seance_id === s.id ? { ...d, seance_id: null } : d))) // on delete set null
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
            onEditExercice={exId => setEditingExo(exercices.find(e => e.id === exId) ?? null)}
            onPublicationChange={publiee => modifierPublication(selected.id, publiee)}
            onNotesChange={(pilier, notes) => modifierNotes(selected.id, pilier, notes)}
            devoirs={devoirs}
            onNewDevoir={() => setEditingDevoir(emptyDraft(FOCUS_TAG, selected.id))}
            onEditDevoir={d => setEditingDevoir({ ...d, commentaire: d.commentaire ?? '' })}
            onAttachDevoir={(devoirId, attach) => rattacherDevoir(devoirId, attach ? selected.id : null)}
          />
        </div>
      )}

      {/* Même formulaire que l'onglet « Devoirs à rendre » ; la suppression reste réservée à cet onglet */}
      {editingDevoir && (
        <Modal title={editingDevoir.id ? 'Modifier le devoir' : 'Nouveau devoir'} subtitle="Le travail autonome · Formation Focus" onClose={() => setEditingDevoir(null)}>
          <DevoirForm
            draft={editingDevoir}
            contexteLocked
            exercices={exercices}
            onExerciceCreated={ex => setExercices(list => [...list, ex].sort((a, b) => a.titre.localeCompare(b.titre, 'fr')))}
            onCancel={() => setEditingDevoir(null)}
            onSaved={() => { setEditingDevoir(null); rechargerDevoirs() }}
          />
        </Modal>
      )}

      {/* Même formulaire que l'onglet « Exercices » ; la suppression reste réservée à cet onglet */}
      {editingExo && (
        <Modal title="Modifier l'exercice" subtitle="Les modifications s'appliquent partout où l'exercice est utilisé." onClose={() => setEditingExo(null)}>
          <ExerciceForm
            draft={editingExo}
            usedIn={0}
            notions={notions}
            onNotionCreated={nv => setNotions(list => [...list, nv].sort((a, b) => a.libelle.localeCompare(b.libelle)))}
            onCancel={() => setEditingExo(null)}
            onSaved={() => { setEditingExo(null); rechargerExercices() }}
          />
        </Modal>
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

/** Liste des séances ; partagée avec l'espace élève (sans le badge « Publiée »). */
export function SeancesList({ seances, selectedId, onSelect, showPublication = true }: { seances: FocusSeance[]; selectedId: string; onSelect: (id: string) => void; showPublication?: boolean }) {
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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: active ? '#cf3594' : 'rgba(255,255,255,0.85)' }}>
                    {s.date.trim() || 'Sans date'}
                  </span>
                  {showPublication && s.publiee && (
                    <span title="Visible par les élèves Focus" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4db8c8' }}>
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 13 }}>visibility</span>
                      Publiée
                    </span>
                  )}
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

function SeanceEditor({ seance, dateInputRef, canDelete, onChange, onDelete, exercices, onExercicesChange, onCreateExercice, onEditExercice, onPublicationChange, onNotesChange, devoirs, onNewDevoir, onEditDevoir, onAttachDevoir }: {
  seance: FocusSeance
  dateInputRef: React.RefObject<HTMLInputElement | null>
  canDelete: boolean
  onChange: (champ: Champ, valeur: string) => void
  onDelete: () => void
  exercices: Exercice[]
  onExercicesChange: (pilier: PilierKey, ids: string[]) => void
  onCreateExercice: (titre: string) => Promise<Exercice | null>
  onEditExercice: (exId: string) => void
  onPublicationChange: (publiee: boolean) => void
  onNotesChange: (pilier: NoteKey, notes: string) => void
  devoirs: Devoir[]
  onNewDevoir: () => void
  onEditDevoir: (d: Devoir) => void
  onAttachDevoir: (devoirId: string, attach: boolean) => void
}) {
  const id = (champ: Champ) => `focus-seance-${champ}`

  return (
    <section aria-label={`Séance ${libelleSeance(seance)}`} className="flex-1 min-w-0" style={{ ...card, padding: '1.5rem' }}>
      <label
        htmlFor="focus-seance-publiee"
        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: '0.75rem', cursor: 'pointer', border: `1px solid ${seance.publiee ? 'rgba(77,184,200,0.45)' : 'rgba(255,255,255,0.12)'}`, background: seance.publiee ? 'rgba(77,184,200,0.1)' : 'rgba(255,255,255,0.03)' }}
      >
        <input
          id="focus-seance-publiee"
          type="checkbox"
          checked={seance.publiee}
          onChange={e => onPublicationChange(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, accentColor: '#4db8c8', flexShrink: 0, cursor: 'pointer' }}
        />
        <span>
          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: seance.publiee ? '#4db8c8' : 'rgba(255,255,255,0.85)' }}>
            {seance.publiee ? 'Visible par les élèves Focus' : 'Privée'}
          </span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
            {seance.publiee
              ? 'Les élèves Formation Focus 2026-2027 voient le thème, les 5 piliers et les exercices, en lecture seule.'
              : 'Cochez pour rendre cette séance visible dans l’espace élève Formation Focus.'}
          </span>
        </span>
      </label>

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

      {/* Note générale de la séance : même table que les notes par pilier (pilier = 'general'), jamais visible des élèves */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.75rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px dashed rgba(240,168,48,0.35)', background: 'rgba(240,168,48,0.04)' }}>
        <label htmlFor="focus-seance-notes-generales" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f0a830', fontSize: '0.85rem', fontWeight: 600 }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>lock</span>
          <span style={{ flex: 1 }}>Notes générales de la séance</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>jamais visibles des élèves</span>
        </label>
        <AutoTextarea
          id="focus-seance-notes-generales"
          value={seance.notes.general ?? ''}
          onChange={v => onNotesChange('general', v)}
          accent="#f0a830"
          placeholder="Intention globale, déroulé, matériel, points d'attention sur le groupe…"
          minHeight="4.5rem"
        />
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
              {p.key === 'autonome' && (
                <DevoirsSeance
                  idBase={id(p.key)}
                  seanceId={seance.id}
                  devoirs={devoirs}
                  exercices={exercices}
                  onNew={onNewDevoir}
                  onEdit={onEditDevoir}
                  onAttach={onAttachDevoir}
                />
              )}
              {/* Le travail autonome passe par les devoirs ; ses anciens exercices restent affichés pour pouvoir les retirer */}
              {(p.key !== 'autonome' || (seance.exercices[p.key] ?? []).length > 0) && (
                <ExercicesPilier
                  idBase={id(p.key)}
                  pilierLabel={p.label}
                  selection={seance.exercices[p.key] ?? []}
                  exercices={exercices}
                  onChange={ids => onExercicesChange(p.key, ids)}
                  onCreate={onCreateExercice}
                  onEdit={onEditExercice}
                />
              )}
              <NotesPrivees
                id={`${id(p.key)}-notes`}
                pilierLabel={p.label}
                value={seance.notes[p.key] ?? ''}
                onChange={v => onNotesChange(p.key, v)}
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

function ExercicesPilier({ idBase, pilierLabel, selection, exercices, onChange, onCreate, onEdit }: {
  idBase: string
  pilierLabel: string
  selection: string[]
  exercices: Exercice[]
  onChange: (ids: string[]) => void
  onCreate: (titre: string) => Promise<Exercice | null>
  onEdit: (exId: string) => void
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
              <IconButton icon="edit" title={`Modifier « ${titreOf(exId)} »`} disabled={!exercices.some(e => e.id === exId)} onClick={() => onEdit(exId)} />
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

/* ── Devoirs à rendre de la séance (bloc « Le travail autonome ») ── */

function DevoirsSeance({ idBase, seanceId, devoirs, exercices, onNew, onEdit, onAttach }: {
  idBase: string
  seanceId: string
  devoirs: Devoir[]
  exercices: Exercice[]
  onNew: () => void
  onEdit: (d: Devoir) => void
  onAttach: (devoirId: string, attach: boolean) => void
}) {
  const lies = devoirs.filter(d => d.seance_id === seanceId)
  const libres = devoirs.filter(d => !d.seance_id)
  const titreDevoir = (d: Devoir) =>
    (d.exercice_id && exercices.find(e => e.id === d.exercice_id)?.titre)
    || d.commentaire?.split('\n').find(l => l.trim())?.trim()
    || 'Contenu à venir'
  const dateDevoir = (d: Devoir) => formatDay(d.date_limite, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {lies.length > 0 && (
        <ul aria-label="Devoirs à rendre de la séance" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {lies.map(d => (
            <li key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>assignment</span>
              <span style={{ flexShrink: 0, color: PILIER_COLORS.autonome, fontWeight: 600, whiteSpace: 'nowrap' }}>{dateDevoir(d)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: hasContent(d) ? undefined : 'rgba(255,255,255,0.4)', fontStyle: hasContent(d) ? undefined : 'italic' }}>{titreDevoir(d)}</span>
              <IconButton icon="edit" title={`Modifier le devoir du ${dateDevoir(d)}`} onClick={() => onEdit(d)} />
              <IconButton icon="link_off" title={`Retirer de la séance le devoir du ${dateDevoir(d)} (il reste dans « Devoirs à rendre »)`} onClick={() => onAttach(d.id, false)} />
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {libres.length > 0 && (
          <>
            <label htmlFor={`${idBase}-rattacher-devoir`} className="sr-only">Rattacher un devoir existant à la séance</label>
            <select
              id={`${idBase}-rattacher-devoir`}
              value=""
              onChange={e => e.target.value && onAttach(e.target.value, true)}
              style={{ ...input, flex: '1 1 220px', padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}
            >
              <option value="" style={{ background: '#1a0b2e' }}>+ Rattacher un devoir existant…</option>
              {libres.map(d => <option key={d.id} value={d.id} style={{ background: '#1a0b2e' }}>{dateDevoir(d)} · {titreDevoir(d)}</option>)}
            </select>
          </>
        )}
        <button type="button" onClick={onNew} style={{ ...btnGhost, padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>add</span>
          Nouveau devoir
        </button>
      </div>
    </div>
  )
}

/* ── Notes privées d'un pilier (table focus_seance_notes, jamais visible des élèves) ── */

function NotesPrivees({ id, pilierLabel, value, onChange }: {
  id: string
  pilierLabel: string
  value: string
  onChange: (value: string) => void
}) {
  // Ouvert d'office s'il y a déjà des notes
  const [open, setOpen] = useState(() => !!value.trim())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const etat = value.trim() ? ' (remplies)' : ''

  return (
    <div style={{ borderRadius: '0.6rem', border: '1px dashed rgba(240,168,48,0.35)', background: 'rgba(240,168,48,0.04)' }}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) requestAnimationFrame(() => textareaRef.current?.focus()) }}
        aria-expanded={open}
        aria-controls={id}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', padding: '0.45rem 0.7rem', border: 'none', background: 'transparent', color: '#f0a830', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>lock</span>
        <span style={{ flex: 1 }}>Notes privées{etat}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>jamais visibles des élèves</span>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>expand_more</span>
      </button>
      {open && (
        <div style={{ padding: '0 0.7rem 0.7rem' }}>
          <label htmlFor={id} className="sr-only">Notes privées : {pilierLabel}</label>
          <AutoTextarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            accent="#f0a830"
            placeholder="Points de vigilance, plan B, rappels pour moi…"
            minHeight="3.5rem"
            rows={2}
          />
        </div>
      )}
    </div>
  )
}

/* ── Zone de texte qui s'agrandit avec son contenu ────── */

function AutoTextarea({ id, value, onChange, accent, placeholder = 'Exercices, intentions, déroulé…', minHeight = '5.5rem', rows = 3, ref: externalRef, ...rest }: {
  id: string
  value: string
  onChange: (value: string) => void
  accent: string
  placeholder?: string
  minHeight?: string
  rows?: number
  ref?: React.RefObject<HTMLTextAreaElement | null>
  'aria-describedby'?: string
}) {
  const localRef = useRef<HTMLTextAreaElement>(null)
  const ref = externalRef ?? localRef

  const ajuster = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px` // + les 2 px de bordure (box-sizing: border-box)
  }, [ref])

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
      rows={rows}
      placeholder={placeholder}
      style={{ ...input, width: '100%', minHeight, resize: 'none', overflow: 'hidden', lineHeight: 1.6, borderLeft: `3px solid ${accent}99` }}
      {...rest}
    />
  )
}
