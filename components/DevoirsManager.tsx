'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, FilterPill, ExerciceDetail, ConfirmDialog, RowActions, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnGhost, th, td } from '@/components/ManagerUI'
import { formatDay, parseDay, todayKey } from '@/lib/formation-focus'
import { STUDENT_TAGS, type StudentTagKey } from '@/lib/student-tags'
import { EXERCICE_COLUMNS, SUIVI_CONTEXTES, fetchNotions, notionLabels, tagInfo, type Exercice, type Notion, type SuiviContexte } from '@/lib/suivi'
import { DEVOIR_COLUMNS, hasContent, type Devoir, type DevoirRendu } from '@/lib/devoirs'
import { displayName, fetchFiches, type FicheEleve } from '@/lib/eleves'

type Draft = Omit<Devoir, 'id'> & { id?: string }

const emptyDraft = (contexte: SuiviContexte): Draft => ({ contexte, date_limite: todayKey(), exercice_id: null, commentaire: '', etiquettes: [contexte] })

/**
 * Devoirs à rendre. Chaque élève marque « J'ai rendu l'exercice » (table devoirs_rendus).
 * Avec `contexte` + `userId` : page d'un bloc de l'espace élève.
 * Sans `contexte` : tous les contextes, avec filtre et choix du contexte (/admin) ; sans `userId`, pas de bouton de rendu.
 * `canEdit` (admin) : créer/modifier/supprimer les devoirs et voir qui a rendu.
 */
export default function DevoirsManager({ contexte, userId, canEdit, depotUrl }: {
  contexte?: SuiviContexte
  userId?: string
  canEdit: boolean
  depotUrl?: string // dossier partagé où déposer les enregistrements
}) {
  const [filter, setFilter] = useState<SuiviContexte | 'all'>('all')
  const [devoirs, setDevoirs] = useState<Devoir[]>([])
  const [exercices, setExercices] = useState<Exercice[]>([])
  const [notions, setNotions] = useState<Map<string, Notion>>(new Map())
  const [rendus, setRendus] = useState<DevoirRendu[]>([]) // élève : les siens ; admin : tous
  const [emails, setEmails] = useState<Map<string, string>>(new Map())
  const [fiches, setFiches] = useState<Map<string, FicheEleve>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [openedExo, setOpenedExo] = useState<Exercice | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)

  async function load() {
    setError('')
    let query = supabase.from('devoirs').select(DEVOIR_COLUMNS).order('date_limite')
    if (contexte) query = query.eq('contexte', contexte)
    const [d, e, r] = await Promise.all([
      query,
      supabase.from('exercices').select(EXERCICE_COLUMNS).order('titre'),
      supabase.from('devoirs_rendus').select('devoir_id, user_id, date_rendu'),
    ])
    const err = d.error ?? e.error ?? r.error
    if (err) setError(err.message)
    setDevoirs((d.data ?? []) as Devoir[])
    setExercices((e.data ?? []) as Exercice[])
    fetchNotions().then(list => setNotions(new Map(list.map(n => [n.id, n]))))
    setRendus((r.data ?? []) as DevoirRendu[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [contexte])

  // Élève : son groupe (fiche élève), pour savoir où déposer son rendu
  const [monGroupe, setMonGroupe] = useState<string | null | undefined>(undefined) // undefined = pas encore chargé
  useEffect(() => {
    if (!userId) return
    fetchFiches().then(map => setMonGroupe(map.get(userId)?.groupe ?? null))
  }, [userId])

  // Admin : emails des élèves pour afficher qui a rendu
  useEffect(() => {
    if (!canEdit) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } })
      if (!res.ok) return
      const body = await res.json()
      setEmails(new Map((body.users ?? []).map((u: { id: string; email: string | null }) => [u.id, u.email ?? u.id])))
      setFiches(await fetchFiches())
    })
  }, [canEdit])

  async function toggleRendu(devoir: Devoir) {
    if (!userId) return
    setBusy(devoir.id)
    const mine = rendus.find(r => r.devoir_id === devoir.id && r.user_id === userId)
    const { error } = mine
      ? await supabase.from('devoirs_rendus').delete().eq('devoir_id', devoir.id).eq('user_id', userId)
      : await supabase.from('devoirs_rendus').insert({ devoir_id: devoir.id, user_id: userId })
    setBusy(null)
    if (error) { setError(error.message); return }
    load()
  }

  function askRemove(d: Devoir) {
    const n = rendusOf(d).length
    setConfirmReq({
      title: 'Supprimer ce devoir ?',
      message: `Le devoir à rendre le ${formatDay(d.date_limite, { weekday: 'long', day: 'numeric', month: 'long' })} sera définitivement supprimé.`
        + (n ? `\nLes ${n} rendu${n > 1 ? 's' : ''} d'élèves seront aussi supprimé${n > 1 ? 's' : ''}.` : ''),
      onConfirm: async () => {
        const { error } = await supabase.from('devoirs').delete().eq('id', d.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
        setOpenedId(null)
        load()
      },
    })
  }

  const today = todayKey()
  const exoById = new Map(exercices.map(e => [e.id, e]))
  const myRendu = (d: Devoir) => (userId ? rendus.find(r => r.devoir_id === d.id && r.user_id === userId) : undefined)
  const rendusOf = (d: Devoir) => rendus.filter(r => r.devoir_id === d.id)
  const opened = devoirs.find(d => d.id === openedId) ?? null
  const shown = filter === 'all' ? devoirs : devoirs.filter(d => d.contexte === filter)

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Devoirs à rendre</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            {contexte
              ? `${tagInfo(contexte).label} · l'exercice à réaliser entre les séances, et la date à laquelle le rendre.`
              : 'Les devoirs de toutes les formations : exercice, commentaire et date de rendu.'}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setDraft(emptyDraft(contexte ?? (filter === 'all' ? 'focus2026-2027' : filter)))} style={btnAccent}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
            Nouveau devoir
          </button>
        )}
      </div>

      {(userId || depotUrl) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          {userId && monGroupe !== undefined && (
            <div style={{ ...card, flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#8e5bd8', flexShrink: 0 }}>groups</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>Mon groupe</span>
                {monGroupe
                  ? <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginTop: '0.15rem' }}>{monGroupe}</span>
                  : <span style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem' }}>Pas encore attribué</span>}
              </span>
            </div>
          )}
          {depotUrl && (
            <a href={depotUrl} target="_blank" rel="noopener noreferrer" className="hover:bg-white/10" style={{ ...card, flex: '2 1 300px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', color: '#fff', textDecoration: 'none', transition: 'background 0.15s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: contexte ? tagInfo(contexte).color : '#cf3594', flexShrink: 0 }}>add_to_drive</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600 }}>Déposer mes enregistrements</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem' }}>
                  Le dossier Google Drive partagé du groupe
                </span>
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)' }}>open_in_new</span>
            </a>
          )}
        </div>
      )}

      {!contexte && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} color="#cf3594">Tous</FilterPill>
          {SUIVI_CONTEXTES.map(c => (
            <FilterPill key={c} active={filter === c} onClick={() => setFilter(c)} color={tagInfo(c).color}>{tagInfo(c).label}</FilterPill>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucun devoir pour le moment.</p>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ ...th, width: '9.5rem' }}>À rendre le</th>
                {!contexte && <th className="hidden md:table-cell" style={{ ...th, width: '8rem' }}>Contexte</th>}
                <th style={th}>Exercice</th>
                <th className="hidden sm:table-cell" style={{ ...th, width: canEdit ? '7rem' : '12rem' }}>{canEdit ? 'Rendus' : 'Statut'}</th>
                <th style={{ ...th, width: rowActionsWidth(canEdit) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(d => {
                const past = d.date_limite < today
                const exo = d.exercice_id ? exoById.get(d.exercice_id) : undefined
                return (
                  <tr
                    key={d.id}
                    onClick={() => setOpenedId(d.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenedId(d.id) } }}
                    tabIndex={0}
                    className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                    style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s', opacity: past && (canEdit || myRendu(d)) ? 0.6 : 1 }}
                  >
                    <td style={{ ...td, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {capitalize(formatDay(d.date_limite, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}
                    </td>
                    {!contexte && (
                      <td className="hidden md:table-cell" style={td}>
                        <ContextePill contexte={d.contexte} />
                      </td>
                    )}
                    <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hasContent(d)
                        ? (exo?.titre ?? <span style={{ color: 'rgba(255,255,255,0.7)' }}>{firstLine(d.commentaire)}</span>)
                        : <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Contenu à venir</span>}
                    </td>
                    <td className="hidden sm:table-cell" style={td}>
                      {canEdit
                        ? <span style={{ color: 'rgba(255,255,255,0.55)' }}>{rendusOf(d).length || '—'}</span>
                        : <StatusBadge devoir={d} rendu={myRendu(d)} today={today} />}
                    </td>
                    <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                      <RowActions onDelete={canEdit ? () => askRemove(d) : undefined} deleteTitle="Supprimer ce devoir" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale d'exercice : remplace celle du devoir, qui réapparaît à la fermeture */}
      {opened && openedExo && (
        <Modal title={openedExo.titre} subtitle="Exercice" onClose={() => setOpenedExo(null)}>
          <ExerciceDetail exercice={openedExo} notions={notionLabels(openedExo, notions)} />
          <button type="button" onClick={() => setOpenedExo(null)} style={{ ...btnGhost, marginTop: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
            Retour au devoir
          </button>
        </Modal>
      )}

      {opened && !openedExo && !draft && (
        <Modal title={`À rendre le ${formatDay(opened.date_limite, { weekday: 'long', day: 'numeric', month: 'long' })}`} subtitle={tagInfo(opened.contexte).label} onClose={() => setOpenedId(null)}>
          {!hasContent(opened) ? (
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: 0 }}>Contenu à venir.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {opened.exercice_id && exoById.get(opened.exercice_id) && (
                <section>
                  <Label>Exercice</Label>
                  <button
                    type="button"
                    onClick={() => setOpenedExo(exoById.get(opened.exercice_id!)!)}
                    className="hover:bg-white/10 focus-visible:bg-white/10 outline-none"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.6rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>{exoById.get(opened.exercice_id)!.titre}</span>
                      {notionLabels(exoById.get(opened.exercice_id)!, notions).length > 0 && (
                        <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notionLabels(exoById.get(opened.exercice_id)!, notions).join(' · ')}</span>
                      )}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>chevron_right</span>
                  </button>
                </section>
              )}
              {opened.commentaire?.trim() && (
                <section>
                  <Label>Commentaire</Label>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', margin: 0 }}>{opened.commentaire}</p>
                </section>
              )}
            </div>
          )}

          {/* Rendu de l'élève (pas dans la vue admin, qui n'a pas d'élève) */}
          {userId && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            {myRendu(opened) ? (
              <>
                <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#4db8aa' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>task_alt</span>
                  Rendu le {formatDay(myRendu(opened)!.date_rendu.slice(0, 10), { day: 'numeric', month: 'long' })}
                </span>
                <button onClick={() => toggleRendu(opened)} disabled={busy === opened.id} style={btnGhost}>Annuler le rendu</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge devoir={opened} today={today} />
                  {monGroupe && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999, color: '#b89aec', border: '1px solid rgba(142,91,216,0.5)', background: 'rgba(142,91,216,0.15)', whiteSpace: 'nowrap' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>groups</span>
                      {monGroupe}
                    </span>
                  )}
                </span>
                {depotUrl && hasContent(opened) && (
                  <a href={depotUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add_to_drive</span>
                    Déposer sur le Drive
                  </a>
                )}
                <button onClick={() => toggleRendu(opened)} disabled={busy === opened.id || !hasContent(opened)} style={{ ...btnAccent, opacity: hasContent(opened) ? 1 : 0.4, cursor: hasContent(opened) ? 'pointer' : 'default' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>check</span>
                  {busy === opened.id ? 'Enregistrement…' : "J'ai rendu l'exercice"}
                </button>
              </>
            )}
          </div>
          )}

          {canEdit && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Label>Rendu par {rendusOf(opened).length} élève{rendusOf(opened).length > 1 ? 's' : ''}</Label>
              {rendusOf(opened).length > 0 && (
                <ul style={{ margin: '0 0 1rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  {rendusOf(opened).map(r => (
                    <li key={r.user_id}>{displayName(fiches.get(r.user_id), emails.get(r.user_id))}{fiches.get(r.user_id)?.groupe ? ` (${fiches.get(r.user_id)!.groupe})` : ''} · le {formatDay(r.date_rendu.slice(0, 10), { day: 'numeric', month: 'short' })}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ flex: 1, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                  Visible par : {opened.etiquettes.length ? opened.etiquettes.map(t => tagInfo(t).label).join(', ') : 'admins uniquement'}
                </span>
                <button onClick={() => askRemove(opened)} style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  Supprimer
                </button>
                <button onClick={() => setDraft({ ...opened, commentaire: opened.commentaire ?? '' })} style={btnAccent}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                  Modifier
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {draft && (
        <Modal title={draft.id ? 'Modifier le devoir' : 'Nouveau devoir'} subtitle={contexte && tagInfo(contexte).label} onClose={() => setDraft(null)}>
          <DevoirForm draft={draft} contexteLocked={!!contexte} exercices={exercices} onCancel={() => setDraft(null)} onSaved={() => { setDraft(null); load() }} />
        </Modal>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function StatusBadge({ devoir, rendu, today }: { devoir: Devoir; rendu?: DevoirRendu; today: string }) {
  if (rendu) return <Badge color="#4db8aa" icon="task_alt">Rendu</Badge>
  if (!hasContent(devoir)) return <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>—</span>
  const days = Math.round((parseDay(devoir.date_limite).getTime() - parseDay(today).getTime()) / 86_400_000)
  if (days < 0) return <Badge color="#f87171" icon="schedule">En retard</Badge>
  return <Badge color="#e0a72e" icon="hourglass_top">{days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days} jours`}</Badge>
}

function Badge({ color, icon, children }: { color: string; icon: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999, color, border: `1px solid ${color}66`, background: `${color}1a`, whiteSpace: 'nowrap' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
      {children}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>{children}</div>
}

function ContextePill({ contexte }: { contexte: string }) {
  const { label, color } = tagInfo(contexte)
  return <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: 999, color, border: `1px solid ${color}`, background: `${color}1f`, whiteSpace: 'nowrap' }}>{label}</span>
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function firstLine(text: string | null) {
  return text?.split('\n').find(l => l.trim())?.trim() ?? ''
}

/* ── Formulaire admin ─────────────────────────────────── */

function DevoirForm({ draft: initial, contexteLocked, exercices, onCancel, onSaved }: {
  draft: Draft
  contexteLocked: boolean
  exercices: Exercice[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }))

  function toggleEtiquette(key: StudentTagKey) {
    update({ etiquettes: draft.etiquettes.includes(key) ? draft.etiquettes.filter(t => t !== key) : [...draft.etiquettes, key] })
  }

  function changeContexte(next: SuiviContexte) {
    // Le nouveau contexte donne accès par défaut ; l'ancien est retiré des étiquettes.
    const etiquettes = draft.etiquettes.filter(t => t !== draft.contexte)
    update({ contexte: next, etiquettes: [...new Set<StudentTagKey>([...etiquettes, next])] })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const row = {
      contexte: draft.contexte,
      date_limite: draft.date_limite,
      exercice_id: draft.exercice_id || null,
      commentaire: draft.commentaire?.trim() || null,
      etiquettes: draft.etiquettes,
      updated_at: new Date().toISOString(),
    }
    const { error } = draft.id
      ? await supabase.from('devoirs').update(row).eq('id', draft.id)
      : await supabase.from('devoirs').insert(row)
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <Field label="À rendre le">
          <input type="date" required value={draft.date_limite} onChange={e => update({ date_limite: e.target.value })} style={input} />
        </Field>
        {!contexteLocked && (
          <Field label="Contexte">
            <select value={draft.contexte} onChange={e => changeContexte(e.target.value as SuiviContexte)} style={input}>
              {SUIVI_CONTEXTES.map(c => <option key={c} value={c} style={{ background: '#1a0b2e' }}>{tagInfo(c).label}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Field label="Exercice">
        <select value={draft.exercice_id ?? ''} onChange={e => update({ exercice_id: e.target.value || null })} style={input}>
          <option value="" style={{ background: '#1a0b2e' }}>— Aucun pour l'instant —</option>
          {exercices.map(ex => <option key={ex.id} value={ex.id} style={{ background: '#1a0b2e' }}>{ex.titre}</option>)}
        </select>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Les exercices se créent dans Administration → Exercices.</span>
      </Field>

      <Field label="Commentaire">
        <textarea value={draft.commentaire ?? ''} onChange={e => update({ commentaire: e.target.value })} rows={5} placeholder="Consignes, ce qu'il faut enregistrer, où le déposer…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

      <Field label="Visible par les élèves ayant l'étiquette">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {STUDENT_TAGS.filter(t => t.key !== 'admin').map(t => (
            <FilterPill key={t.key} active={draft.etiquettes.includes(t.key)} onClick={() => toggleEtiquette(t.key)} color={t.color}>{t.label}</FilterPill>
          ))}
        </div>
      </Field>

      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Sans exercice ni commentaire, les élèves voient « Contenu à venir ».</p>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
