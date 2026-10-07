'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, ConfirmDialog, RowActions, rowActionsWidth, NotionPicker, type ConfirmRequest, input, btnAccent, btnGhost, th, td } from '@/components/ManagerUI'
import { EXERCICE_COLUMNS, createNotion, fetchNotions, notionLabels, type Exercice, type Notion } from '@/lib/suivi'

type Draft = Omit<Exercice, 'id'> & { id?: string }

const emptyDraft = (): Draft => ({ titre: '', description: '', notions_objectifs: [] })

/** Bibliothèque d'exercices (table public.exercices) : liste, création, modification, suppression. Réservé aux admins (RLS). */
export default function ExercicesManager() {
  const [exercices, setExercices] = useState<Exercice[]>([])
  const [usage, setUsage] = useState<Map<string, number>>(new Map())
  const [notions, setNotions] = useState<Notion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)

  async function load() {
    setError('')
    const [e, s, n] = await Promise.all([
      supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre'),
      supabase.from('suivi_seances').select('exercices'),
      fetchNotions(),
    ])
    if (e.error || s.error) setError((e.error ?? s.error)!.message)
    setExercices((e.data ?? []) as Exercice[])
    setNotions(n)
    const counts = new Map<string, number>()
    for (const row of (s.data ?? []) as { exercices: string[] }[]) {
      for (const id of row.exercices) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    setUsage(counts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function askRemove(ex: Exercice) {
    const n = usage.get(ex.id) ?? 0
    setConfirmReq({
      title: 'Supprimer cet exercice ?',
      message: `« ${ex.titre} » sera définitivement supprimé de la bibliothèque.`
        + (n ? `\nIl sera aussi retiré des ${n} séance${n > 1 ? 's' : ''} où il apparaît.` : '')
        + "\nLes devoirs qui l'utilisent n'auront plus d'exercice associé.",
      onConfirm: () => remove(ex),
    })
  }

  async function remove(ex: Exercice) {
    // suivi_seances.exercices est un tableau d'ids (pas de clé étrangère) : on retire l'id à la main.
    if (usage.get(ex.id)) {
      const { data, error } = await supabase.from('suivi_seances').select('id, exercices').contains('exercices', [ex.id])
      if (error) { setError(`Suppression impossible : ${error.message}`); return }
      for (const row of data ?? []) {
        const { error } = await supabase.from('suivi_seances').update({ exercices: (row.exercices as string[]).filter(id => id !== ex.id) }).eq('id', row.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
      }
    }

    // devoirs.exercice_id a une clé étrangère "on delete set null" : rien à faire côté devoirs.
    const { error } = await supabase.from('exercices').delete().eq('id', ex.id)
    if (error) { setError(`Suppression impossible : ${error.message}`); return }
    setDraft(null)
    load()
  }

  const notionById = new Map(notions.map(n => [n.id, n]))
  const q = search.trim().toLowerCase()
  const shown = q
    ? exercices.filter(e => [e.titre, e.description, ...notionLabels(e, notionById)].some(v => v?.toLowerCase().includes(q)))
    : exercices

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Exercices</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>La bibliothèque d'exercices utilisée dans les récaps de séances.</p>
        </div>
        <button onClick={() => setDraft(emptyDraft())} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Nouvel exercice
        </button>
      </div>

      {exercices.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un exercice…" style={{ ...input, width: '100%', maxWidth: 360, marginBottom: '1.25rem' }} />
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{q ? 'Aucun exercice ne correspond.' : 'Aucun exercice pour le moment.'}</p>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ ...th, width: '35%' }}>Exercice</th>
                <th className="hidden sm:table-cell" style={th}>Notions et objectifs</th>
                <th className="hidden md:table-cell" style={{ ...th, width: '7rem' }}>Séances</th>
                <th style={{ ...th, width: rowActionsWidth(true) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(e => {
                const n = usage.get(e.id) ?? 0
                const open = () => setDraft({ ...e, description: e.description ?? '' })
                return (
                  <tr
                    key={e.id}
                    onClick={open}
                    onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open() } }}
                    tabIndex={0}
                    className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                    style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                  >
                    <td style={{ ...td, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titre}</td>
                    <td className="hidden sm:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notionLabels(e, notionById).join(' · ') || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                    </td>
                    <td className="hidden md:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.55)' }}>{n || '—'}</td>
                    <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                      <RowActions onDelete={() => askRemove(e)} deleteTitle="Supprimer cet exercice" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <Modal title={draft.id ? "Modifier l'exercice" : 'Nouvel exercice'} onClose={() => setDraft(null)}>
          <ExerciceForm
            draft={draft}
            usedIn={draft.id ? usage.get(draft.id) ?? 0 : 0}
            notions={notions}
            onNotionCreated={n => setNotions(list => [...list, n].sort((a, b) => a.libelle.localeCompare(b.libelle)))}
            onCancel={() => setDraft(null)}
            onDelete={draft.id ? () => askRemove(exercices.find(e => e.id === draft.id)!) : undefined}
            onSaved={() => { setDraft(null); load() }}
          />
        </Modal>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function ExerciceForm({ draft: initial, usedIn, notions, onNotionCreated, onCancel, onDelete, onSaved }: {
  draft: Draft
  notions: Notion[]
  onNotionCreated: (n: Notion) => void
  usedIn: number
  onCancel: () => void
  onDelete?: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const titre = draft.titre.trim()
    if (!titre) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError('')
    const row = {
      titre,
      description: draft.description?.trim() || null,
      notions_objectifs: draft.notions_objectifs,
      updated_at: new Date().toISOString(),
    }
    const { error } = draft.id
      ? await supabase.from('exercices').update(row).eq('id', draft.id)
      : await supabase.from('exercices').insert(row)
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Field label="Titre">
        <input value={draft.titre} onChange={e => update({ titre: e.target.value })} required autoFocus placeholder="Ex. : Ostinato en boucle" style={input} />
      </Field>

      <Field label="Notions et objectifs">
        <NotionPicker
          notions={notions}
          selected={draft.notions_objectifs}
          onChange={ids => update({ notions_objectifs: ids })}
          onCreate={async libelle => {
            const { notion, error } = await createNotion(libelle)
            if (error) setError(error)
            if (notion && !notions.some(x => x.id === notion.id)) onNotionCreated(notion)
            return notion
          }}
        />
      </Field>

      <Field label="Description de l'exercice">
        <textarea value={draft.description ?? ''} onChange={e => update({ description: e.target.value })} rows={6} placeholder="Déroulé, consignes, variantes…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

      {usedIn > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Utilisé dans {usedIn} séance{usedIn > 1 ? 's' : ''}.
        </p>
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {onDelete && (
          <button type="button" onClick={onDelete} style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
            Supprimer
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onCancel} style={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

