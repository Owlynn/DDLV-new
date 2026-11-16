'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { ConfirmDialog, Field, Modal, RowActions, SearchSelect, normaliser, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnDanger, th, td } from '@/components/ManagerUI'
import { createNotion, fetchNotions, type Notion } from '@/lib/suivi'

// Réglages → Étiquettes des exercices : la liste public.notions_objectifs (les « notions et objectifs »
// choisies dans chaque exercice). Création, renommage, fusion de deux étiquettes, suppression.
// exercices.notions_objectifs est un tableau d'ids sans clé étrangère : fusion et suppression le mettent à jour à la main.

interface ExerciceLite { id: string; titre: string; notions_objectifs: string[] }

type Tri = 'alpha' | 'usage'

export default function NotionsManager() {
  const [notions, setNotions] = useState<Notion[]>([])
  const [exercices, setExercices] = useState<ExerciceLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tri, setTri] = useState<Tri>('alpha')
  const [nouvelle, setNouvelle] = useState('')
  const [adding, setAdding] = useState(false)
  const [ouverte, setOuverte] = useState<Notion | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)

  async function load() {
    const [n, e] = await Promise.all([
      fetchNotions(),
      supabase.from('exercices').select('id, titre, notions_objectifs').order('titre'),
    ])
    if (e.error) setError(`Chargement impossible : ${e.error.message}`)
    setNotions(n)
    setExercices((e.data ?? []) as ExerciceLite[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Étiquette → exercices qui l'utilisent
  const usage = useMemo(() => {
    const m = new Map<string, ExerciceLite[]>()
    for (const ex of exercices) for (const id of ex.notions_objectifs) m.set(id, [...(m.get(id) ?? []), ex])
    return m
  }, [exercices])

  const q = normaliser(search)
  const shown = notions
    .filter(n => !q || normaliser(n.libelle).includes(q))
    .sort((a, b) => tri === 'usage'
      ? (usage.get(b.id)?.length ?? 0) - (usage.get(a.id)?.length ?? 0) || a.libelle.localeCompare(b.libelle, 'fr')
      : a.libelle.localeCompare(b.libelle, 'fr'))
  const inutilisees = notions.filter(n => !usage.get(n.id)?.length).length

  async function ajouter() {
    const libelle = nouvelle.trim()
    if (!libelle || adding) return
    if (notions.some(n => normaliser(n.libelle) === normaliser(libelle))) { setError(`L’étiquette « ${libelle} » existe déjà.`); return }
    setAdding(true)
    setError('')
    const { notion, error } = await createNotion(libelle)
    setAdding(false)
    if (!notion) { setError(`Création impossible : ${error ?? 'erreur inconnue'}`); return }
    setNouvelle('')
    setNotions(list => [...list.filter(n => n.id !== notion.id), notion])
  }

  /** Remplace l'étiquette `source` par `cible` (ou la retire si cible = null) dans tous les exercices. */
  async function reecrireExercices(source: string, cible: string | null) {
    for (const ex of usage.get(source) ?? []) {
      const ids = [...new Set(ex.notions_objectifs.map(id => (id === source ? cible : id)).filter((id): id is string => !!id))]
      const { error } = await supabase.from('exercices').update({ notions_objectifs: ids }).eq('id', ex.id)
      if (error) throw new Error(`« ${ex.titre} » : ${error.message}`)
    }
  }

  async function renommer(n: Notion, libelle: string): Promise<string | null> {
    const l = libelle.trim()
    if (!l) return 'Le nom ne peut pas être vide.'
    const doublon = notions.find(x => x.id !== n.id && normaliser(x.libelle) === normaliser(l))
    if (doublon) return `L’étiquette « ${doublon.libelle} » existe déjà : utilisez « Fusionner » pour les réunir.`
    const { data, error } = await supabase.from('notions_objectifs').update({ libelle: l }).eq('id', n.id).select('id')
    if (error || !data?.length) return `Renommage impossible : ${error?.message ?? 'accès refusé'}`
    setNotions(list => list.map(x => (x.id === n.id ? { ...x, libelle: l } : x)))
    setOuverte(o => (o?.id === n.id ? { ...o, libelle: l } : o))
    return null
  }

  function demanderFusion(source: Notion, cible: Notion) {
    const nb = usage.get(source.id)?.length ?? 0
    setConfirmReq({
      title: 'Fusionner ces étiquettes ?',
      message: `« ${source.libelle} » sera remplacée par « ${cible.libelle} »`
        + (nb ? ` dans ${nb} exercice${nb > 1 ? 's' : ''}` : '')
        + `, puis supprimée.`,
      confirmLabel: 'Fusionner',
      onConfirm: async () => {
        try {
          await reecrireExercices(source.id, cible.id)
          const { error } = await supabase.from('notions_objectifs').delete().eq('id', source.id)
          if (error) throw new Error(error.message)
          setOuverte(null)
        } catch (e) {
          setError(`Fusion incomplète : ${e instanceof Error ? e.message : 'erreur inconnue'}`)
        }
        load()
      },
    })
  }

  function demanderSuppression(n: Notion) {
    const nb = usage.get(n.id)?.length ?? 0
    setConfirmReq({
      title: 'Supprimer cette étiquette ?',
      message: `« ${n.libelle} » sera définitivement supprimée.`
        + (nb ? `\nElle sera retirée des ${nb} exercice${nb > 1 ? 's' : ''} qui l’utilisent (les exercices sont conservés).` : ''),
      onConfirm: async () => {
        try {
          await reecrireExercices(n.id, null)
          const { error } = await supabase.from('notions_objectifs').delete().eq('id', n.id)
          if (error) throw new Error(error.message)
          setOuverte(null)
        } catch (e) {
          setError(`Suppression incomplète : ${e instanceof Error ? e.message : 'erreur inconnue'}`)
        }
        load()
      },
    })
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Étiquettes des exercices</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Les notions et objectifs que l’on choisit dans chaque exercice : renommer, fusionner les doublons, supprimer.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une étiquette…" aria-label="Rechercher une étiquette" style={{ ...input, flex: '1 1 220px', maxWidth: 320 }} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
          Trier
          <select value={tri} onChange={e => setTri(e.target.value as Tri)} style={{ ...input, padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}>
            <option value="alpha" style={{ background: '#1a0b2e' }}>de A à Z</option>
            <option value="usage" style={{ background: '#1a0b2e' }}>les plus utilisées</option>
          </select>
        </label>
        <form onSubmit={e => { e.preventDefault(); ajouter() }} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 280px', justifyContent: 'flex-end' }}>
          <input value={nouvelle} onChange={e => setNouvelle(e.target.value)} placeholder="Nouvelle étiquette" aria-label="Nouvelle étiquette" style={{ ...input, flex: 1, minWidth: 0, maxWidth: 240 }} />
          <button type="submit" disabled={!nouvelle.trim() || adding} style={{ ...btnAccent, opacity: nouvelle.trim() && !adding ? 1 : 0.5 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>add</span>
            {adding ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      </div>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{q ? 'Aucune étiquette ne correspond.' : 'Aucune étiquette pour le moment.'}</p>
      ) : (
        <>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 0.6rem' }}>
            {notions.length} étiquette{notions.length > 1 ? 's' : ''}{inutilisees ? ` · ${inutilisees} inutilisée${inutilisees > 1 ? 's' : ''}` : ''}
          </p>
          <div style={{ ...card, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={th}>Étiquette</th>
                  <th style={{ ...th, width: '7.5rem' }}>Exercices</th>
                  <th style={{ ...th, width: rowActionsWidth(true) }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map(n => {
                  const nb = usage.get(n.id)?.length ?? 0
                  const open = () => { setError(''); setOuverte(n) }
                  return (
                    <tr
                      key={n.id}
                      onClick={open}
                      onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open() } }}
                      tabIndex={0}
                      className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                      style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                    >
                      <td style={{ ...td, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.libelle}</td>
                      <td style={{ ...td, color: nb ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>{nb || 'aucun'}</td>
                      <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                        <RowActions onDelete={() => demanderSuppression(n)} deleteTitle={`Supprimer l’étiquette « ${n.libelle} »`} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {ouverte && (
        <Modal title={ouverte.libelle} subtitle="Étiquette d’exercice" onClose={() => setOuverte(null)}>
          <FicheEtiquette
            key={ouverte.id}
            notion={ouverte}
            autres={notions.filter(n => n.id !== ouverte.id)}
            exercices={usage.get(ouverte.id) ?? []}
            onRename={l => renommer(ouverte, l)}
            onMerge={cible => demanderFusion(ouverte, cible)}
            onDelete={() => demanderSuppression(ouverte)}
          />
        </Modal>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function FicheEtiquette({ notion, autres, exercices, onRename, onMerge, onDelete }: {
  notion: Notion
  autres: Notion[]
  exercices: ExerciceLite[]
  onRename: (libelle: string) => Promise<string | null> // message d'erreur, ou null si renommée
  onMerge: (cible: Notion) => void
  onDelete: () => void
}) {
  const [libelle, setLibelle] = useState(notion.libelle)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const modifie = libelle.trim() !== notion.libelle

  async function enregistrer() {
    if (!modifie || busy) return
    setBusy(true)
    const err = await onRename(libelle)
    setBusy(false)
    setMessage(err ? { ok: false, text: err } : { ok: true, text: 'Étiquette renommée.' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Field label="Nom">
        <form onSubmit={e => { e.preventDefault(); enregistrer() }} style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={libelle} onChange={e => { setLibelle(e.target.value); setMessage(null) }} style={{ ...input, flex: 1, minWidth: 0 }} />
          <button type="submit" disabled={!modifie || busy} style={{ ...btnAccent, opacity: modifie && !busy ? 1 : 0.5 }}>{busy ? 'Enregistrement…' : 'Renommer'}</button>
        </form>
        {message && <p role="status" style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: message.ok ? '#4db8c8' : '#f87171' }}>{message.text}</p>}
      </Field>

      <Field label={`Utilisée dans ${exercices.length} exercice${exercices.length > 1 ? 's' : ''}`}>
        {exercices.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Aucun exercice n’utilise cette étiquette.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {exercices.map(ex => (
              <li key={ex.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>library_music</span>
                {ex.titre}
              </li>
            ))}
          </ul>
        )}
      </Field>

      {autres.length > 0 && (
        <Field label="Fusionner avec une autre étiquette">
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
            Pour les doublons : les exercices prennent l’étiquette choisie, puis « {notion.libelle} » est supprimée.
          </p>
          <SearchSelect
            options={autres.map(n => ({ id: n.id, label: n.libelle }))}
            onSelect={id => { const cible = autres.find(n => n.id === id); if (cible) onMerge(cible) }}
            placeholder="Choisir l’étiquette à garder… (tapez pour chercher)"
          />
        </Field>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" onClick={onDelete} style={btnDanger}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>delete</span>
          Supprimer l’étiquette
        </button>
      </div>
    </div>
  )
}
