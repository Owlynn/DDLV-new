'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, FilterPill, ConfirmDialog, RowActions, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnGhost, btnDanger, th, td } from '@/components/ManagerUI'
import { STUDENT_TAGS, type StudentTagKey } from '@/lib/student-tags'
import { fetchFiches, saveFiche, type FicheEleve } from '@/lib/eleves'

// Onglet « Élèves » de /admin : comptes (API admin Supabase) + étiquettes (student_tags) + fiches (eleves).

interface Eleve {
  id: string
  email: string | null
  created_at: string
  confirmed_at: string | null
  tags: StudentTagKey[]
  fiche: FicheEleve
}

const emptyFiche = (userId: string): FicheEleve => ({ user_id: userId, prenom: null, nom: null, telephone: null, groupe: null })

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}

export default function ElevesManager() {
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<StudentTagKey | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)

  async function load() {
    setError('')
    try {
      const [res, tagsRes, fiches] = await Promise.all([
        fetch('/api/admin/users', { headers: await authHeader() }),
        supabase.from('student_tags').select('user_id, tags'),
        fetchFiches(),
      ])
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
      const tagMap = new Map((tagsRes.data ?? []).map(r => [r.user_id as string, (r.tags ?? []) as StudentTagKey[]]))
      setEleves((body.users ?? []).map((u: Omit<Eleve, 'tags' | 'fiche'>) => ({
        ...u,
        tags: tagMap.get(u.id) ?? [],
        fiche: fiches.get(u.id) ?? emptyFiche(u.id),
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function askRemove(e: Eleve) {
    setConfirmReq({
      title: 'Supprimer cet élève ?',
      message: `Le compte de ${fullName(e) || e.email} sera supprimé : il ne pourra plus se connecter.\nSa fiche, ses étiquettes et ses rendus de devoirs seront aussi supprimés.\nSes paiements sont conservés.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${e.id}`, { method: 'DELETE', headers: await authHeader() })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          setError(`Suppression impossible : ${body?.error ?? `erreur ${res.status}`}`)
          return
        }
        setOpenedId(null)
        setEleves(list => list.filter(x => x.id !== e.id))
      },
    })
  }

  const groupes = [...new Set(eleves.map(e => e.fiche.groupe).filter((g): g is string => !!g))].sort()
  const q = search.trim().toLowerCase()
  const shown = eleves
    .filter(e => tagFilter === 'all' || e.tags.includes(tagFilter))
    .filter(e => groupFilter === 'all' || (groupFilter === 'none' ? !e.fiche.groupe : e.fiche.groupe === groupFilter))
    .filter(e => !q || [e.fiche.prenom, e.fiche.nom, e.email, e.fiche.telephone].some(v => v?.toLowerCase().includes(q)))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'fr'))
  const opened = eleves.find(e => e.id === openedId) ?? null

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Élèves</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Invitez des élèves à créer leur compte (ils ne peuvent pas s'inscrire seuls), puis complétez leur fiche.</p>
      </div>

      <InviteForm onInvited={load} />

      {/* Recherche et filtres */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0 1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (nom, email, téléphone)…" style={{ ...input, flex: '1 1 240px', maxWidth: 340 }} />
        {groupes.length > 0 && (
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{ ...input, flex: '0 0 auto' }}>
            <option value="all" style={{ background: '#1a0b2e' }}>Tous les groupes</option>
            {groupes.map(g => <option key={g} value={g} style={{ background: '#1a0b2e' }}>{g}</option>)}
            <option value="none" style={{ background: '#1a0b2e' }}>Sans groupe</option>
          </select>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <FilterPill active={tagFilter === 'all'} onClick={() => setTagFilter('all')} color="#cf3594">Tous</FilterPill>
        {STUDENT_TAGS.map(t => (
          <FilterPill key={t.key} active={tagFilter === t.key} onClick={() => setTagFilter(t.key)} color={t.color}>{t.label}</FilterPill>
        ))}
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{eleves.length ? 'Aucun élève ne correspond.' : 'Aucun élève invité pour le moment.'}</p>
      ) : (
        <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={th}>Nom</th>
                <th style={th}>Prénom</th>
                <th className="hidden md:table-cell" style={th}>Email</th>
                <th className="hidden lg:table-cell" style={th}>Téléphone</th>
                <th className="hidden sm:table-cell" style={th}>Groupe</th>
                <th className="hidden lg:table-cell" style={th}>Étiquettes</th>
                <th className="hidden md:table-cell" style={th}>Statut</th>
                <th style={{ ...th, width: rowActionsWidth(true) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(e => (
                <tr
                  key={e.id}
                  onClick={() => setOpenedId(e.id)}
                  onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setOpenedId(e.id) } }}
                  tabIndex={0}
                  className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                  style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                >
                  <td style={{ ...td, fontWeight: 500 }}>{e.fiche.nom || <Empty />}</td>
                  <td style={td}>{e.fiche.prenom || <Empty />}</td>
                  <td className="hidden md:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.65)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</td>
                  <td className="hidden lg:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>{e.fiche.telephone || <Empty />}</td>
                  <td className="hidden sm:table-cell" style={td}>{e.fiche.groupe ? <GroupPill groupe={e.fiche.groupe} /> : <Empty />}</td>
                  <td className="hidden lg:table-cell" style={td}><TagPills tags={e.tags} /></td>
                  <td className="hidden md:table-cell" style={td}><StatusPill active={!!e.confirmed_at} /></td>
                  <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                    <RowActions onDelete={() => askRemove(e)} deleteTitle="Supprimer cet élève" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* La fiche reste ouverte sous la confirmation : Annuler y revient sans perdre la saisie */}
      {opened && (
        <EleveModal
          eleve={opened}
          onClose={() => setOpenedId(null)}
          onDelete={() => askRemove(opened)}
          onSaved={updated => setEleves(list => list.map(x => (x.id === updated.id ? updated : x)))}
        />
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

/* ── Invitation ───────────────────────────────────────── */

function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setInviting(true)
    setMessage(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ email: value }),
    })
    const body = await res.json().catch(() => null)
    setInviting(false)
    if (!res.ok) { setMessage({ ok: false, text: body?.error ?? 'Erreur inconnue' }); return }
    setMessage({ ok: true, text: `Invitation envoyée à ${value}.` })
    setEmail('')
    onInvited()
  }

  return (
    <div>
      <form onSubmit={invite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', maxWidth: 520 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email de l'élève" required style={{ ...input, flex: 1, minWidth: 220 }} />
        <button type="submit" disabled={inviting} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>send</span>
          {inviting ? 'Envoi…' : 'Inviter'}
        </button>
      </form>
      {message && <p style={{ color: message.ok ? '#4db8aa' : '#f87171', fontSize: '0.85rem', marginTop: '0.6rem' }}>{message.text}</p>}
    </div>
  )
}

/* ── Fiche élève (modale) ─────────────────────────────── */

function EleveModal({ eleve, onClose, onDelete, onSaved }: {
  eleve: Eleve
  onClose: () => void
  onDelete: () => void
  onSaved: (e: Eleve) => void
}) {
  const [fiche, setFiche] = useState<FicheEleve>(eleve.fiche)
  const [tags, setTags] = useState<StudentTagKey[]>(eleve.tags)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<FicheEleve>) => setFiche(f => ({ ...f, ...patch }))
  const toggleTag = (key: StudentTagKey) => setTags(t => (t.includes(key) ? t.filter(x => x !== key) : [...t, key]))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const [f, t] = await Promise.all([
      saveFiche(fiche),
      supabase.from('student_tags').upsert({ user_id: eleve.id, tags, updated_at: new Date().toISOString() }),
    ])
    setSaving(false)
    const err = f.error ?? t.error
    if (err) { setError(err.message); return }
    const clean = (s: string | null) => s?.trim() || null
    onSaved({ ...eleve, tags, fiche: { ...fiche, prenom: clean(fiche.prenom), nom: clean(fiche.nom), telephone: clean(fiche.telephone), groupe: clean(fiche.groupe) } })
    onClose()
  }

  const invitedOn = new Date(eleve.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Modal title={fullName(eleve) || 'Fiche élève'} subtitle={eleve.email ?? undefined} onClose={onClose}>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <Field label="Prénom">
            <input value={fiche.prenom ?? ''} onChange={e => update({ prenom: e.target.value })} style={input} />
          </Field>
          <Field label="Nom">
            <input value={fiche.nom ?? ''} onChange={e => update({ nom: e.target.value })} style={input} />
          </Field>
          <Field label="Téléphone">
            <input type="tel" value={fiche.telephone ?? ''} onChange={e => update({ telephone: e.target.value })} style={input} />
          </Field>
          <Field label="Groupe (Formation Focus)">
            <input value={fiche.groupe ?? ''} onChange={e => update({ groupe: e.target.value })} placeholder="Ex. : Groupe 1" style={input} />
          </Field>
        </div>

        <Field label="Étiquettes">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {STUDENT_TAGS.map(t => (
              <FilterPill key={t.key} active={tags.includes(t.key)} onClick={() => toggleTag(t.key)} color={t.color}>{t.label}</FilterPill>
            ))}
          </div>
        </Field>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
          <StatusPill active={!!eleve.confirmed_at} />
          <span>Invité le {invitedOn}</span>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button type="button" onClick={onDelete} style={btnDanger}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>person_remove</span>
            Supprimer l'élève
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={btnGhost}>Annuler</button>
          <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Petits éléments ──────────────────────────────────── */

function fullName(e: Eleve) {
  return [e.fiche.prenom, e.fiche.nom].map(s => s?.trim()).filter(Boolean).join(' ')
}

/** Tri par nom, puis prénom ; les fiches vides passent après, triées par email. */
function sortKey(e: Eleve) {
  const nom = e.fiche.nom?.trim() || e.fiche.prenom?.trim()
  return nom ? `0 ${nom} ${e.fiche.prenom ?? ''}`.toLowerCase() : `1 ${e.email ?? ''}`.toLowerCase()
}

function Empty() {
  return <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
}

function GroupPill({ groupe }: { groupe: string }) {
  return <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: 999, color: '#b89aec', border: '1px solid rgba(142,91,216,0.5)', background: 'rgba(142,91,216,0.15)', whiteSpace: 'nowrap' }}>{groupe}</span>
}

function TagPills({ tags }: { tags: StudentTagKey[] }) {
  if (!tags.length) return <Empty />
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
      {STUDENT_TAGS.filter(t => tags.includes(t.key)).map(t => (
        <span key={t.key} style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, padding: '0.12rem 0.45rem', borderRadius: 999, color: t.color, border: `1px solid ${t.color}`, background: `${t.color}22`, whiteSpace: 'nowrap' }}>{t.label}</span>
      ))}
    </span>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap', background: active ? 'rgba(77,184,170,0.2)' : 'rgba(255,255,255,0.1)', color: active ? '#4db8aa' : 'rgba(255,255,255,0.45)' }}>
      {active ? 'Actif' : 'Invitation en attente'}
    </span>
  )
}
