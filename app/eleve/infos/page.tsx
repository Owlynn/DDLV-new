'use client'

import { useEffect, useState } from 'react'
import { useStudent } from '@/components/eleve/StudentContext'
import { card } from '@/components/eleve/ui'
import { Field, input, btnAccent } from '@/components/ManagerUI'
import { fetchFiches, saveFiche, type FicheEleve } from '@/lib/eleves'

export default function MesInfosPage() {
  const { user } = useStudent()
  const [fiche, setFiche] = useState<FicheEleve>({ user_id: user.id, prenom: '', nom: '', telephone: '', groupe: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetchFiches().then(map => {
      const mine = map.get(user.id)
      if (mine) setFiche({ ...mine, prenom: mine.prenom ?? '', nom: mine.nom ?? '', telephone: mine.telephone ?? '' })
      setLoading(false)
    })
  }, [user.id])

  const update = (patch: Partial<FicheEleve>) => { setFiche(f => ({ ...f, ...patch })); setMessage(null) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await saveFiche(fiche)
    setSaving(false)
    setMessage(error ? { ok: false, text: error.message } : { ok: true, text: 'Vos informations sont enregistrées.' })
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Mes informations</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Pour que l'on puisse vous identifier et vous joindre.</p>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : (
        <form onSubmit={save} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Field label="Prénom">
              <input value={fiche.prenom ?? ''} onChange={e => update({ prenom: e.target.value })} autoComplete="given-name" style={input} />
            </Field>
            <Field label="Nom">
              <input value={fiche.nom ?? ''} onChange={e => update({ nom: e.target.value })} autoComplete="family-name" style={input} />
            </Field>
          </div>

          <Field label="Téléphone">
            <input type="tel" value={fiche.telephone ?? ''} onChange={e => update({ telephone: e.target.value })} autoComplete="tel" placeholder="06 12 34 56 78" style={input} />
          </Field>

          <Field label="E-mail">
            <div style={{ ...input, color: 'rgba(255,255,255,0.5)' }}>{user.email}</div>
          </Field>

          {fiche.groupe && (
            <Field label="Groupe">
              <div style={{ ...input, color: 'rgba(255,255,255,0.5)' }}>{fiche.groupe}</div>
            </Field>
          )}

          {message && <p style={{ color: message.ok ? '#4db8aa' : '#f87171', fontSize: '0.85rem', margin: 0 }}>{message.text}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={btnAccent}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
