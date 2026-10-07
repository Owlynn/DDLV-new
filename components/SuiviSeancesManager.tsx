'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, FilterPill, IconButton, ExerciceDetail, ConfirmDialog, RowActions, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnGhost, th, td } from '@/components/ManagerUI'
import { formatDay, todayKey } from '@/lib/formation-focus'
import { STUDENT_TAGS, type StudentTagKey } from '@/lib/student-tags'
import { EXERCICE_COLUMNS, SUIVI_CONTEXTES, fetchNotions, notionLabels, tagInfo, type Exercice, type Notion, type SuiviContexte, type SuiviSeance } from '@/lib/suivi'

type Draft = Omit<SuiviSeance, 'id'> & { id?: string }

const emptyDraft = (contexte: SuiviContexte): Draft => ({ date: todayKey(), contexte, recap: '', exercices: [], etiquettes: [contexte] })

/**
 * Tableau des récaps de séances (table suivi_seances) + modale de détail et formulaire.
 * Avec `contexte` : uniquement ce contexte (blocs de l'espace élève).
 * Sans `contexte` : tous les contextes, avec filtre et choix du contexte dans le formulaire (/admin).
 * `canEdit` affiche création/modification/suppression (la RLS réserve de toute façon l'écriture aux admins).
 */
export default function SuiviSeancesManager({ contexte, canEdit }: { contexte?: SuiviContexte; canEdit: boolean }) {
  const isAdmin = canEdit

  const [seances, setSeances] = useState<SuiviSeance[]>([])
  const [exercices, setExercices] = useState<Exercice[]>([])
  const [notions, setNotions] = useState<Map<string, Notion>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<SuiviContexte | 'all'>('all')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const opened = seances.find(s => s.id === openedId) ?? null
  const [openedExoId, setOpenedExoId] = useState<string | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const openedExo = exercices.find(e => e.id === openedExoId) ?? null

  async function load() {
    setError('')
    let query = supabase.from('suivi_seances').select('id, date, contexte, recap, exercices, etiquettes').order('date', { ascending: false })
    if (contexte) query = query.eq('contexte', contexte)
    const [s, e] = await Promise.all([
      query,
      supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre'),
    ])
    if (s.error || e.error) setError((s.error ?? e.error)!.message)
    setSeances((s.data ?? []) as SuiviSeance[])
    setExercices((e.data ?? []) as Exercice[])
    fetchNotions().then(list => setNotions(new Map(list.map(n => [n.id, n]))))
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [contexte])

  function askRemove(s: SuiviSeance) {
    setConfirmReq({
      title: 'Supprimer ce récap ?',
      message: `Le récap de la séance du ${formatDay(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} sera définitivement supprimé.\nLes exercices restent dans la bibliothèque.`,
      onConfirm: async () => {
        const { error } = await supabase.from('suivi_seances').delete().eq('id', s.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
        setOpenedId(null)
        setSeances(list => list.filter(x => x.id !== s.id))
      },
    })
  }

  const shown = filter === 'all' ? seances : seances.filter(s => s.contexte === filter)
  const exerciceById = new Map(exercices.map(e => [e.id, e]))
  const exosOf = (s: SuiviSeance) => s.exercices.map(id => exerciceById.get(id)).filter((e): e is Exercice => !!e)
  const firstLine = (recap: string | null) => recap?.split('\n').find(l => l.trim())?.trim() ?? ''

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Suivi des séances</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{contexte ? `${tagInfo(contexte).label} · le récap de chaque séance et les exercices travaillés.` : 'Les récaps de toutes les séances : Formation Focus, cours et ateliers.'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setDraft(emptyDraft(contexte ?? (filter === 'all' ? 'focus2026-2027' : filter)))} style={btnAccent}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
            Nouveau récap
          </button>
        )}
      </div>

      {!contexte && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} color="#cf3594">Toutes</FilterPill>
          {SUIVI_CONTEXTES.map(c => (
            <FilterPill key={c} active={filter === c} onClick={() => setFilter(c)} color={tagInfo(c).color}>{tagInfo(c).label}</FilterPill>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucun récap de séance pour le moment.</p>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ ...th, width: '9.5rem' }}>Date</th>
                {!contexte && <th className="hidden md:table-cell" style={{ ...th, width: '8rem' }}>Contexte</th>}
                <th style={th}>Récap</th>
                <th className="hidden sm:table-cell" style={{ ...th, width: '7.5rem' }}>Exercices</th>
                <th style={{ ...th, width: rowActionsWidth(isAdmin) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(s => {
                const nbExos = exosOf(s).length
                return (
                  <tr
                    key={s.id}
                    onClick={() => setOpenedId(s.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenedId(s.id) } }}
                    tabIndex={0}
                    className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                    style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                  >
                    <td style={{ ...td, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {capitalize(formatDay(s.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}
                    </td>
                    {!contexte && (
                      <td className="hidden md:table-cell" style={td}>
                        <ContextePill contexte={s.contexte} />
                      </td>
                    )}
                    <td style={{ ...td, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {firstLine(s.recap) || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                    </td>
                    <td className="hidden sm:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.55)' }}>
                      {nbExos ? `${nbExos} exercice${nbExos > 1 ? 's' : ''}` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                      <RowActions onDelete={isAdmin ? () => askRemove(s) : undefined} deleteTitle="Supprimer ce récap" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale d'exercice : remplace celle de la séance, qui réapparaît à la fermeture */}
      {opened && openedExo && !draft && (
        <Modal title={openedExo.titre} subtitle="Exercice" onClose={() => setOpenedExoId(null)}>
          <ExerciceDetail exercice={openedExo} notions={notionLabels(openedExo, notions)} />
          <button type="button" onClick={() => setOpenedExoId(null)} style={{ ...btnGhost, marginTop: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
            Retour à la séance
          </button>
        </Modal>
      )}

      {opened && !openedExo && !draft && (
        <Modal title={capitalize(formatDay(opened.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} subtitle={tagInfo(opened.contexte).label} onClose={() => setOpenedId(null)}>
          {opened.recap
            ? <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', margin: 0 }}>{opened.recap}</p>
            : <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Pas de récap pour cette séance.</p>}

          {exosOf(opened).length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.6rem' }}>Exercices</div>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {exosOf(opened).map((e, i) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setOpenedExoId(e.id)}
                      className="hover:bg-white/10 focus-visible:bg-white/10 outline-none"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.6rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s' }}
                    >
                      <span style={{ color: tagInfo(opened.contexte).color, fontWeight: 600 }}>{i + 1}.</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500 }}>{e.titre}</span>
                        {notionLabels(e, notions).length > 0 && (
                          <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notionLabels(e, notions).join(' · ')}</span>
                        )}
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>chevron_right</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ flex: 1, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                Visible par : {opened.etiquettes.length ? opened.etiquettes.map(t => tagInfo(t).label).join(', ') : 'admins uniquement'}
              </span>
              <button onClick={() => askRemove(opened)} style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                Supprimer
              </button>
              <button onClick={() => setDraft({ ...opened, recap: opened.recap ?? '' })} style={btnAccent}>
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                Modifier
              </button>
            </div>
          )}
        </Modal>
      )}

      {draft && (
        <Modal title={draft.id ? 'Modifier le récap' : 'Nouveau récap de séance'} subtitle={contexte && tagInfo(contexte).label} onClose={() => setDraft(null)}>
          <SeanceForm
            draft={draft}
            contexteLocked={!!contexte}
            exercices={exercices}
            onCancel={() => setDraft(null)}
            onExerciceCreated={ex => setExercices(list => [...list, ex].sort((a, b) => a.titre.localeCompare(b.titre)))}
            onSaved={() => { setDraft(null); load() }}
          />
        </Modal>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ContextePill({ contexte }: { contexte: string }) {
  const { label, color } = tagInfo(contexte)
  return <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: 999, color, border: `1px solid ${color}`, background: `${color}1f`, whiteSpace: 'nowrap' }}>{label}</span>
}


/* ── Formulaire admin ─────────────────────────────────── */

function SeanceForm({ draft: initial, contexteLocked, exercices, onCancel, onSaved, onExerciceCreated }: {
  draft: Draft
  contexteLocked: boolean
  exercices: Exercice[]
  onCancel: () => void
  onSaved: () => void
  onExerciceCreated: (e: Exercice) => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [newExo, setNewExo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }))

  function changeContexte(next: SuiviContexte) {
    // Le nouveau contexte donne accès par défaut ; l'ancien est retiré des étiquettes.
    const etiquettes = draft.etiquettes.filter(t => t !== draft.contexte)
    update({ contexte: next, etiquettes: [...new Set<StudentTagKey>([...etiquettes, next])] })
  }

  function toggleEtiquette(key: StudentTagKey) {
    update({ etiquettes: draft.etiquettes.includes(key) ? draft.etiquettes.filter(t => t !== key) : [...draft.etiquettes, key] })
  }

  function moveExo(index: number, delta: number) {
    const list = [...draft.exercices]
    const [item] = list.splice(index, 1)
    list.splice(index + delta, 0, item)
    update({ exercices: list })
  }

  async function createExo() {
    const titre = newExo.trim()
    if (!titre) return
    const { data, error } = await supabase.from('exercices').insert({ titre }).select(EXERCICE_COLUMNS).single()
    if (error) { setError(error.message); return }
    onExerciceCreated(data as Exercice)
    update({ exercices: [...draft.exercices, data.id] })
    setNewExo('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const row = {
      date: draft.date,
      contexte: draft.contexte,
      recap: draft.recap?.trim() || null,
      exercices: draft.exercices,
      etiquettes: draft.etiquettes,
      updated_at: new Date().toISOString(),
    }
    const { error } = draft.id
      ? await supabase.from('suivi_seances').update(row).eq('id', draft.id)
      : await supabase.from('suivi_seances').insert(row)
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  const available = exercices.filter(e => !draft.exercices.includes(e.id))
  const titreOf = (id: string) => exercices.find(e => e.id === id)?.titre ?? 'Exercice supprimé'

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <Field label="Date">
          <input type="date" required value={draft.date} onChange={e => update({ date: e.target.value })} style={input} />
        </Field>
        {!contexteLocked && (
          <Field label="Contexte">
            <select value={draft.contexte} onChange={e => changeContexte(e.target.value as SuiviContexte)} style={input}>
              {SUIVI_CONTEXTES.map(c => <option key={c} value={c} style={{ background: '#1a0b2e' }}>{tagInfo(c).label}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Field label="Visible par les élèves ayant l'étiquette">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {STUDENT_TAGS.filter(t => t.key !== 'admin').map(t => (
            <FilterPill key={t.key} active={draft.etiquettes.includes(t.key)} onClick={() => toggleEtiquette(t.key)} color={t.color}>{t.label}</FilterPill>
          ))}
        </div>
      </Field>

      <Field label="Récap">
        <textarea value={draft.recap ?? ''} onChange={e => update({ recap: e.target.value })} rows={6} placeholder="Ce qu'on a travaillé pendant la séance…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

      <Field label="Exercices réalisés">
        {draft.exercices.length > 0 && (
          <ol style={{ margin: '0 0 0.6rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {draft.exercices.map((id, i) => (
              <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', width: 18 }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>{titreOf(id)}</span>
                <IconButton icon="arrow_upward" title="Monter" disabled={i === 0} onClick={() => moveExo(i, -1)} />
                <IconButton icon="arrow_downward" title="Descendre" disabled={i === draft.exercices.length - 1} onClick={() => moveExo(i, 1)} />
                <IconButton icon="close" title="Retirer" onClick={() => update({ exercices: draft.exercices.filter(x => x !== id) })} />
              </li>
            ))}
          </ol>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {available.length > 0 && (
            <select value="" onChange={e => e.target.value && update({ exercices: [...draft.exercices, e.target.value] })} style={{ ...input, flex: '1 1 200px' }}>
              <option value="" style={{ background: '#1a0b2e' }}>Ajouter un exercice existant…</option>
              {available.map(e => <option key={e.id} value={e.id} style={{ background: '#1a0b2e' }}>{e.titre}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 260px' }}>
            <input value={newExo} onChange={e => setNewExo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createExo() } }} placeholder="Ou créer un nouvel exercice" style={{ ...input, flex: 1 }} />
            <button type="button" onClick={createExo} disabled={!newExo.trim()} style={{ ...btnGhost, opacity: newExo.trim() ? 1 : 0.4 }}>Créer</button>
          </div>
        </div>
      </Field>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

