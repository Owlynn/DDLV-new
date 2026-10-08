'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, FilterPill, ConfirmDialog, RowActions, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnGhost, th, td } from '@/components/ManagerUI'
import { formatDay, todayKey } from '@/lib/formation-focus'
import { displayName, fetchFiches } from '@/lib/eleves'
import { SUIVI_CONTEXTES, tagInfo, type SuiviContexte } from '@/lib/suivi'
import { MOYENS_PAIEMENT, PAIEMENT_COLUMNS, STATUT_LABELS, formatEuros, statutPaiement, type Paiement, type StatutPaiement } from '@/lib/paiements'

// Onglet « Paiements » de /admin : saisie manuelle des échéances (table paiements), filtres et totaux.

interface EleveOption {
  id: string
  nom: string
}

type Draft = Omit<Paiement, 'id' | 'montant_du' | 'montant_paye'> & {
  id?: string
  // Saisis en texte pour accepter la virgule (« 12,50 »)
  montant_du: string
  montant_paye: string
}

const emptyDraft = (): Draft => ({
  user_id: null, eleve_nom: null, date: todayKey(), libelle: '', contexte: null,
  montant_du: '', montant_paye: '0', echeance: null, moyen_paiement: null, commentaire: null,
})

const toDraft = (p: Paiement): Draft => ({ ...p, montant_du: String(p.montant_du), montant_paye: String(p.montant_paye) })

const parseMontant = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'))

const STATUT_COLORS: Record<StatutPaiement, string> = {
  paye: '#4db8aa',
  partiel: '#f5b041',
  en_attente: '#a9a3b8',
  en_retard: '#f87171',
}

type StatutFilter = 'all' | 'a_encaisser' | StatutPaiement

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}

export default function PaiementsManager() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [eleves, setEleves] = useState<EleveOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all')
  const [contexteFilter, setContexteFilter] = useState<SuiviContexte | 'all'>('all')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)

  async function load() {
    setError('')
    try {
      const [p, res, fiches] = await Promise.all([
        supabase.from('paiements').select(PAIEMENT_COLUMNS).order('date', { ascending: false }),
        fetch('/api/admin/users', { headers: await authHeader() }),
        fetchFiches(),
      ])
      if (p.error) throw new Error(p.error.message)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
      setPaiements((p.data ?? []) as Paiement[])
      setEleves(((body.users ?? []) as { id: string; email: string | null }[])
        .map(u => ({ id: u.id, nom: displayName(fiches.get(u.id), u.email) }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function askRemove(p: Paiement) {
    setConfirmReq({
      title: 'Supprimer ce paiement ?',
      message: `« ${p.libelle} » (${p.eleve_nom ?? 'élève inconnu'}, ${formatEuros(p.montant_du)}) sera définitivement supprimé.`,
      onConfirm: async () => {
        const { error } = await supabase.from('paiements').delete().eq('id', p.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
        setDraft(null)
        setPaiements(list => list.filter(x => x.id !== p.id))
      },
    })
  }

  const q = search.trim().toLowerCase()
  const shown = paiements.filter(p => {
    const statut = statutPaiement(p)
    if (statutFilter === 'a_encaisser' ? statut === 'paye' : statutFilter !== 'all' && statut !== statutFilter) return false
    if (contexteFilter !== 'all' && p.contexte !== contexteFilter) return false
    if (q && !`${p.eleve_nom ?? ''} ${p.libelle} ${p.commentaire ?? ''}`.toLowerCase().includes(q)) return false
    return true
  })

  const totalDu = shown.reduce((s, p) => s + Number(p.montant_du), 0)
  const totalPaye = shown.reduce((s, p) => s + Number(p.montant_paye), 0)
  const opened = draft?.id ? paiements.find(p => p.id === draft.id) : undefined

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Paiements</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Une ligne par échéance : ce qui est dû, ce qui a été payé.</p>
        </div>
        <button onClick={() => setDraft(emptyDraft())} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Nouveau paiement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Total label="Total dû" value={totalDu} />
        <Total label="Encaissé" value={totalPaye} color="#4db8aa" />
        <Total label="Reste à percevoir" value={Math.max(totalDu - totalPaye, 0)} color="#cf3594" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève, un libellé…" style={{ ...input, maxWidth: 360 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <FilterPill active={statutFilter === 'all'} onClick={() => setStatutFilter('all')} color="#cf3594">Tous</FilterPill>
          <FilterPill active={statutFilter === 'a_encaisser'} onClick={() => setStatutFilter('a_encaisser')} color="#cf3594">À encaisser</FilterPill>
          {(Object.keys(STATUT_LABELS) as StatutPaiement[]).map(s => (
            <FilterPill key={s} active={statutFilter === s} onClick={() => setStatutFilter(s)} color={STATUT_COLORS[s]}>{STATUT_LABELS[s]}</FilterPill>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <FilterPill active={contexteFilter === 'all'} onClick={() => setContexteFilter('all')} color="#cf3594">Tous contextes</FilterPill>
          {SUIVI_CONTEXTES.map(c => (
            <FilterPill key={c} active={contexteFilter === c} onClick={() => setContexteFilter(c)} color={tagInfo(c).color}>{tagInfo(c).label}</FilterPill>
          ))}
        </div>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{paiements.length ? 'Aucun paiement ne correspond à ces filtres.' : 'Aucun paiement pour le moment.'}</p>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th className="hidden sm:table-cell" style={{ ...th, width: '7.5rem' }}>Date</th>
                <th style={th}>Élève</th>
                <th className="hidden md:table-cell" style={th}>Libellé</th>
                <th style={{ ...th, width: '6.5rem', textAlign: 'right' }}>Dû</th>
                <th className="hidden sm:table-cell" style={{ ...th, width: '6.5rem', textAlign: 'right' }}>Payé</th>
                <th style={{ ...th, width: '7rem' }}>Statut</th>
                <th style={{ ...th, width: rowActionsWidth(true) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setDraft(toDraft(p))}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraft(toDraft(p)) } }}
                  tabIndex={0}
                  className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                  style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                >
                  <td className="hidden sm:table-cell" style={{ ...td, whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)' }}>
                    {formatDay(p.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ ...td, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.eleve_nom ?? '—'}
                    {!p.user_id && <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>(compte supprimé)</span>}
                    <span className="md:hidden" style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.libelle}</span>
                  </td>
                  <td className="hidden md:table-cell" style={{ ...td, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.libelle}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatEuros(p.montant_du)}</td>
                  <td className="hidden sm:table-cell" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)' }}>{formatEuros(p.montant_paye)}</td>
                  <td style={td}><StatutPill statut={statutPaiement(p)} /></td>
                  <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                    <RowActions onDelete={() => askRemove(p)} deleteTitle="Supprimer ce paiement" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <Modal title={draft.id ? 'Modifier le paiement' : 'Nouveau paiement'} subtitle={draft.id ? draft.eleve_nom ?? undefined : undefined} onClose={() => setDraft(null)}>
          <PaiementForm
            draft={draft}
            eleves={eleves}
            onCancel={() => setDraft(null)}
            onDelete={opened ? () => askRemove(opened) : undefined}
            onSaved={() => { setDraft(null); load() }}
          />
        </Modal>
      )}

      {confirmReq && <ConfirmDialog request={confirmReq} onClose={() => setConfirmReq(null)} />}
    </div>
  )
}

function Total({ label, value, color = '#fff' }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ ...card, padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{formatEuros(value)}</div>
    </div>
  )
}

function StatutPill({ statut }: { statut: StatutPaiement }) {
  const color = STATUT_COLORS[statut]
  return <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: 999, color, border: `1px solid ${color}`, background: `${color}1f`, whiteSpace: 'nowrap' }}>{STATUT_LABELS[statut]}</span>
}


/* ── Formulaire ───────────────────────────────────────── */

function PaiementForm({ draft: initial, eleves, onCancel, onDelete, onSaved }: {
  draft: Draft
  eleves: EleveOption[]
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
    const du = parseMontant(draft.montant_du)
    const paye = parseMontant(draft.montant_paye || '0')
    if (!draft.user_id && !draft.id) { setError('Choisissez un élève.'); return }
    if (!Number.isFinite(du) || du < 0) { setError('Montant dû invalide.'); return }
    if (!Number.isFinite(paye) || paye < 0) { setError('Montant payé invalide.'); return }

    setSaving(true)
    setError('')
    const row = {
      user_id: draft.user_id,
      date: draft.date,
      libelle: draft.libelle.trim(),
      contexte: draft.contexte,
      montant_du: du,
      montant_paye: paye,
      echeance: draft.echeance || null,
      moyen_paiement: draft.moyen_paiement?.trim() || null,
      commentaire: draft.commentaire?.trim() || null,
    }
    const { error } = draft.id
      ? await supabase.from('paiements').update(row).eq('id', draft.id)
      : await supabase.from('paiements').insert(row)
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  const orphan = !!draft.id && !draft.user_id

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Field label="Élève">
        {orphan ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{draft.eleve_nom ?? '—'} <span style={{ color: 'rgba(255,255,255,0.35)' }}>(compte supprimé)</span></p>
        ) : (
          <select required value={draft.user_id ?? ''} onChange={e => update({ user_id: e.target.value || null })} style={input}>
            <option value="" style={{ background: '#1a0b2e' }}>Choisir un élève…</option>
            {eleves.map(el => <option key={el.id} value={el.id} style={{ background: '#1a0b2e' }}>{el.nom}</option>)}
          </select>
        )}
      </Field>

      <Field label="Libellé">
        <input required value={draft.libelle} onChange={e => update({ libelle: e.target.value })} placeholder="Ex. Formation Focus – 1er versement" style={input} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <Field label="Date">
          <input type="date" required value={draft.date} onChange={e => update({ date: e.target.value })} style={input} />
        </Field>
        <Field label="Échéance (facultatif)">
          <input type="date" value={draft.echeance ?? ''} onChange={e => update({ echeance: e.target.value || null })} style={input} />
        </Field>
        <Field label="Contexte">
          <select value={draft.contexte ?? ''} onChange={e => update({ contexte: (e.target.value || null) as SuiviContexte | null })} style={input}>
            <option value="" style={{ background: '#1a0b2e' }}>—</option>
            {SUIVI_CONTEXTES.map(c => <option key={c} value={c} style={{ background: '#1a0b2e' }}>{tagInfo(c).label}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <Field label="Montant dû (€)">
          <input required inputMode="decimal" value={draft.montant_du} onChange={e => update({ montant_du: e.target.value })} placeholder="0,00" style={input} />
        </Field>
        <Field label="Montant payé (€)">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input inputMode="decimal" value={draft.montant_paye} onChange={e => update({ montant_paye: e.target.value })} placeholder="0,00" style={{ ...input, flex: 1, minWidth: 0 }} />
            <button type="button" onClick={() => update({ montant_paye: draft.montant_du })} disabled={!draft.montant_du} title="Marquer comme entièrement payé" style={{ ...btnGhost, padding: '0.5rem 0.7rem', opacity: draft.montant_du ? 1 : 0.4 }}>Tout</button>
          </div>
        </Field>
        <Field label="Moyen de paiement">
          <input list="moyens-paiement" value={draft.moyen_paiement ?? ''} onChange={e => update({ moyen_paiement: e.target.value })} placeholder="Virement, chèque…" style={input} />
          <datalist id="moyens-paiement">
            {MOYENS_PAIEMENT.map(m => <option key={m} value={m} />)}
          </datalist>
        </Field>
      </div>

      <Field label="Commentaire">
        <textarea value={draft.commentaire ?? ''} onChange={e => update({ commentaire: e.target.value })} rows={3} placeholder="Chèque encaissé le…, remise accordée…" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

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
