'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, Field, FilterPill, ConfirmDialog, IconButton, RowActions, rowActionsWidth, type ConfirmRequest, input, btnAccent, btnGhost, th, td } from '@/components/ManagerUI'
import { formatDay, todayKey } from '@/lib/formation-focus'
import { displayName, fetchFiches } from '@/lib/eleves'
import {
  MOYENS_PAIEMENT, PAIEMENT_ELEVE_COLUMNS, STATUT_LABELS, formatEuros, parseMontant, resteAPayer, statutPaiement, totalPaye,
  type PaiementEleve, type StatutPaiement, type Versement,
} from '@/lib/paiements'

// Onglet « Paiements » de /admin : une ligne par élève (montant total dû) ; les versements ajoutés
// dans sa fiche viennent s'y soustraire. Tables paiements_eleves + versements.

interface EleveOption {
  id: string
  nom: string
}

const STATUT_COLORS: Record<StatutPaiement, string> = {
  solde: '#4db8aa',
  partiel: '#f5b041',
  rien_paye: '#f87171',
}

type StatutFilter = 'all' | 'reste' | 'solde'

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}

const sortVersements = (p: PaiementEleve): PaiementEleve => ({ ...p, versements: [...p.versements].sort((a, b) => a.date.localeCompare(b.date)) })

export default function PaiementsManager() {
  const [lignes, setLignes] = useState<PaiementEleve[]>([])
  const [eleves, setEleves] = useState<EleveOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all')
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const opened = lignes.find(l => l.id === openedId) ?? null

  async function load() {
    setError('')
    try {
      const [p, res, fiches] = await Promise.all([
        supabase.from('paiements_eleves').select(PAIEMENT_ELEVE_COLUMNS),
        fetch('/api/admin/users', { headers: await authHeader() }),
        fetchFiches(),
      ])
      if (p.error) throw new Error(p.error.message)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
      setLignes(((p.data ?? []) as PaiementEleve[]).map(sortVersements).sort((a, b) => (a.eleve_nom ?? '').localeCompare(b.eleve_nom ?? '', 'fr')))
      setEleves(((body.users ?? []) as { id: string; email: string | null }[])
        .map(u => ({ id: u.id, nom: displayName(fiches.get(u.id), u.email) }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  /** Remplace une ligne après modification (montant dû ou versements). */
  function replace(ligne: PaiementEleve) {
    setLignes(list => list.map(l => (l.id === ligne.id ? sortVersements(ligne) : l)))
  }

  function askRemove(l: PaiementEleve) {
    setConfirmReq({
      title: 'Supprimer cette ligne de paiement ?',
      message: `La ligne de ${l.eleve_nom ?? 'cet élève'} et ses ${l.versements.length} versement${l.versements.length > 1 ? 's' : ''} seront définitivement supprimés.`,
      onConfirm: async () => {
        const { error } = await supabase.from('paiements_eleves').delete().eq('id', l.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
        setOpenedId(null)
        setLignes(list => list.filter(x => x.id !== l.id))
      },
    })
  }

  const q = search.trim().toLowerCase()
  const shown = lignes.filter(l => {
    const statut = statutPaiement(l)
    if (statutFilter === 'reste' && statut === 'solde') return false
    if (statutFilter === 'solde' && statut !== 'solde') return false
    if (q && !`${l.eleve_nom ?? ''} ${l.commentaire ?? ''}`.toLowerCase().includes(q)) return false
    return true
  })

  const totalDu = shown.reduce((s, l) => s + Number(l.montant_du), 0)
  const totalEncaisse = shown.reduce((s, l) => s + totalPaye(l), 0)
  const totalReste = shown.reduce((s, l) => s + resteAPayer(l), 0)
  const sansLigne = eleves.filter(e => !lignes.some(l => l.user_id === e.id))

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Paiements</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Une ligne par élève : le montant dû, moins les versements reçus.</p>
        </div>
        <button onClick={() => setCreating(true)} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Ajouter un élève
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Total label="Total dû" value={totalDu} />
        <Total label="Encaissé" value={totalEncaisse} color="#4db8aa" />
        <Total label="Reste à percevoir" value={totalReste} color="#cf3594" />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève…" style={{ ...input, flex: '1 1 220px', maxWidth: 360 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <FilterPill active={statutFilter === 'all'} onClick={() => setStatutFilter('all')} color="#cf3594">Tous</FilterPill>
          <FilterPill active={statutFilter === 'reste'} onClick={() => setStatutFilter('reste')} color="#f5b041">Reste à payer</FilterPill>
          <FilterPill active={statutFilter === 'solde'} onClick={() => setStatutFilter('solde')} color={STATUT_COLORS.solde}>Soldés</FilterPill>
        </div>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{lignes.length ? 'Aucun élève ne correspond à ces filtres.' : 'Aucun paiement pour le moment. Commencez par « Ajouter un élève ».'}</p>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={th}>Élève</th>
                <th className="hidden sm:table-cell" style={{ ...th, width: '7rem', textAlign: 'right' }}>Dû</th>
                <th className="hidden sm:table-cell" style={{ ...th, width: '7rem', textAlign: 'right' }}>Payé</th>
                <th style={{ ...th, width: '7rem', textAlign: 'right' }}>Reste</th>
                <th className="hidden md:table-cell" style={{ ...th, width: '7rem' }}>Statut</th>
                <th style={{ ...th, width: rowActionsWidth(true) }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setOpenedId(l.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenedId(l.id) } }}
                  tabIndex={0}
                  className="hover:bg-white/5 focus-visible:bg-white/5 outline-none"
                  style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.15s' }}
                >
                  <td style={{ ...td, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.eleve_nom ?? '—'}
                    {!l.user_id && <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>(compte supprimé)</span>}
                    <span style={{ display: 'block', fontWeight: 400, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      {l.versements.length ? `${l.versements.length} versement${l.versements.length > 1 ? 's' : ''}` : 'Aucun versement'}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatEuros(l.montant_du)}</td>
                  <td className="hidden sm:table-cell" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)' }}>{formatEuros(totalPaye(l))}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600, color: resteAPayer(l) > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{formatEuros(resteAPayer(l))}</td>
                  <td className="hidden md:table-cell" style={td}><StatutPill statut={statutPaiement(l)} /></td>
                  <td style={{ ...td, textAlign: 'right', padding: '0.5rem 0.75rem' }}>
                    <RowActions onDelete={() => askRemove(l)} deleteTitle="Supprimer cette ligne" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Ajouter un élève" subtitle="Montant total qu'il doit" onClose={() => setCreating(false)}>
          <NouvelleLigneForm
            eleves={sansLigne}
            onCancel={() => setCreating(false)}
            onCreated={ligne => {
              setCreating(false)
              setLignes(list => [...list, ligne].sort((a, b) => (a.eleve_nom ?? '').localeCompare(b.eleve_nom ?? '', 'fr')))
              setOpenedId(ligne.id)
            }}
          />
        </Modal>
      )}

      {opened && (
        <Modal title={opened.eleve_nom ?? 'Élève'} subtitle={opened.user_id ? 'Fiche de paiement' : 'Fiche de paiement · compte supprimé'} onClose={() => setOpenedId(null)}>
          <FichePaiement key={opened.id} ligne={opened} onChange={replace} onDelete={() => askRemove(opened)} setConfirm={setConfirmReq} />
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


/* ── Nouvelle ligne ───────────────────────────────────── */

function NouvelleLigneForm({ eleves, onCancel, onCreated }: {
  eleves: EleveOption[]
  onCancel: () => void
  onCreated: (ligne: PaiementEleve) => void
}) {
  const [userId, setUserId] = useState('')
  const [montant, setMontant] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const du = parseMontant(montant)
    if (!userId) { setError('Choisissez un élève.'); return }
    if (!Number.isFinite(du) || du < 0) { setError('Montant invalide.'); return }
    setSaving(true)
    setError('')
    const { data, error } = await supabase.from('paiements_eleves').insert({ user_id: userId, montant_du: du }).select(PAIEMENT_ELEVE_COLUMNS).single()
    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated(data as PaiementEleve)
  }

  if (!eleves.length) {
    return <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Tous les élèves ont déjà une ligne de paiement.</p>
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Field label="Élève">
        <select required value={userId} onChange={e => setUserId(e.target.value)} style={input} autoFocus>
          <option value="" style={{ background: '#1a0b2e' }}>Choisir un élève…</option>
          {eleves.map(el => <option key={el.id} value={el.id} style={{ background: '#1a0b2e' }}>{el.nom}</option>)}
        </select>
      </Field>
      <Field label="Montant total dû (€)">
        <input required inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0,00" style={input} />
      </Field>
      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Création…' : 'Créer'}</button>
      </div>
    </form>
  )
}


/* ── Fiche de paiement d'un élève ─────────────────────── */

function FichePaiement({ ligne, onChange, onDelete, setConfirm }: {
  ligne: PaiementEleve
  onChange: (ligne: PaiementEleve) => void
  onDelete: () => void
  setConfirm: (req: ConfirmRequest) => void
}) {
  const [montantDu, setMontantDu] = useState(String(ligne.montant_du).replace('.', ','))
  const [commentaire, setCommentaire] = useState(ligne.commentaire ?? '')
  const [savingInfos, setSavingInfos] = useState(false)
  const [savedInfos, setSavedInfos] = useState(false)
  const [error, setError] = useState('')

  const [vDate, setVDate] = useState(todayKey())
  const [vMontant, setVMontant] = useState('')
  const [vMoyen, setVMoyen] = useState('')
  const [vCommentaire, setVCommentaire] = useState('')
  const [adding, setAdding] = useState(false)

  const infosChanged = parseMontant(montantDu) !== Number(ligne.montant_du) || commentaire.trim() !== (ligne.commentaire ?? '')

  async function saveInfos(e: React.FormEvent) {
    e.preventDefault()
    const du = parseMontant(montantDu)
    if (!Number.isFinite(du) || du < 0) { setError('Montant dû invalide.'); return }
    setSavingInfos(true)
    setError('')
    const { data, error } = await supabase.from('paiements_eleves')
      .update({ montant_du: du, commentaire: commentaire.trim() || null })
      .eq('id', ligne.id).select(PAIEMENT_ELEVE_COLUMNS).single()
    setSavingInfos(false)
    if (error) { setError(error.message); return }
    onChange(data as PaiementEleve)
    setSavedInfos(true)
    setTimeout(() => setSavedInfos(false), 2000)
  }

  async function addVersement(e: React.FormEvent) {
    e.preventDefault()
    const montant = parseMontant(vMontant)
    if (!Number.isFinite(montant) || montant <= 0) { setError('Montant du versement invalide.'); return }
    setAdding(true)
    setError('')
    const { data, error } = await supabase.from('versements').insert({
      paiement_eleve_id: ligne.id,
      date: vDate,
      montant,
      moyen_paiement: vMoyen.trim() || null,
      commentaire: vCommentaire.trim() || null,
    }).select('id, paiement_eleve_id, date, montant, moyen_paiement, commentaire').single()
    setAdding(false)
    if (error) { setError(error.message); return }
    onChange({ ...ligne, versements: [...ligne.versements, data as Versement] })
    setVMontant('')
    setVCommentaire('')
  }

  function askRemoveVersement(v: Versement) {
    setConfirm({
      title: 'Supprimer ce versement ?',
      message: `Le versement de ${formatEuros(v.montant)} du ${formatDay(v.date, { day: 'numeric', month: 'long', year: 'numeric' })} sera supprimé.`,
      onConfirm: async () => {
        const { error } = await supabase.from('versements').delete().eq('id', v.id)
        if (error) { setError(`Suppression impossible : ${error.message}`); return }
        onChange({ ...ligne, versements: ligne.versements.filter(x => x.id !== v.id) })
      },
    })
  }

  const reste = resteAPayer(ligne)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        <Mini label="Dû" value={formatEuros(ligne.montant_du)} />
        <Mini label="Payé" value={formatEuros(totalPaye(ligne))} color="#4db8aa" />
        <Mini label="Reste" value={formatEuros(reste)} color={reste > 0 ? '#cf3594' : 'rgba(255,255,255,0.5)'} />
      </div>

      <form onSubmit={saveInfos} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 200px) 1fr', gap: '0.9rem' }}>
          <Field label="Montant total dû (€)">
            <input required inputMode="decimal" value={montantDu} onChange={e => setMontantDu(e.target.value)} style={input} />
          </Field>
          <Field label="Commentaire">
            <input value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex. Formation Focus 2026-2027, tarif réduit…" style={input} />
          </Field>
        </div>
        {(infosChanged || savedInfos) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingInfos || !infosChanged} style={btnAccent}>
              {savingInfos ? 'Enregistrement…' : savedInfos && !infosChanged ? 'Enregistré ✓' : 'Enregistrer'}
            </button>
          </div>
        )}
      </form>

      <section>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.6rem' }}>Versements</div>
        {ligne.versements.length === 0 ? (
          <p style={{ margin: '0 0 0.9rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Aucun versement pour le moment.</p>
        ) : (
          <ul style={{ margin: '0 0 0.9rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {ligne.versements.map(v => (
              <li key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.4rem 0.5rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                <span style={{ width: '6.5rem', flexShrink: 0, color: 'rgba(255,255,255,0.6)' }}>{formatDay(v.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatEuros(v.montant)}</span>
                <span style={{ flex: 1, minWidth: 0, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[v.moyen_paiement, v.commentaire].filter(Boolean).join(' · ')}
                </span>
                <IconButton icon="delete" title="Supprimer ce versement" danger onClick={() => askRemoveVersement(v)} />
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addVersement} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.9rem', borderRadius: '0.75rem', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            <input type="date" required value={vDate} onChange={e => setVDate(e.target.value)} aria-label="Date du versement" style={input} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input required inputMode="decimal" value={vMontant} onChange={e => setVMontant(e.target.value)} placeholder="Montant €" aria-label="Montant du versement" style={{ ...input, flex: 1, minWidth: 0 }} />
              {reste > 0 && (
                <button type="button" onClick={() => setVMontant(reste.toFixed(2).replace('.', ','))} title="Verser le reste dû" style={{ ...btnGhost, padding: '0.5rem 0.6rem', fontSize: '0.75rem' }}>Reste</button>
              )}
            </div>
            <input list="moyens-paiement" value={vMoyen} onChange={e => setVMoyen(e.target.value)} placeholder="Moyen (chèque…)" aria-label="Moyen de paiement" style={input} />
            <datalist id="moyens-paiement">
              {MOYENS_PAIEMENT.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input value={vCommentaire} onChange={e => setVCommentaire(e.target.value)} placeholder="Commentaire (facultatif)" aria-label="Commentaire du versement" style={{ ...input, flex: 1, minWidth: 0 }} />
            <button type="submit" disabled={adding} style={btnAccent}>
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
              {adding ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </section>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-start' }}>
        <button type="button" onClick={onDelete} style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
          Supprimer la ligne
        </button>
      </div>
    </div>
  )
}

function Mini({ label, value, color = '#fff' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
