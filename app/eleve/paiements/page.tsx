'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useStudent } from '@/components/eleve/StudentContext'
import { card, SectionTitle } from '@/components/eleve/ui'
import { formatDay } from '@/lib/formation-focus'
import { PAIEMENT_ELEVE_COLUMNS, STATUT_LABELS, formatEuros, resteAPayer, statutPaiement, totalPaye, type PaiementEleve } from '@/lib/paiements'

// « Mes paiements » : la ligne de paiement de l'élève (montant dû) et ses versements, en lecture seule.

export default function MesPaiementsPage() {
  const { user } = useStudent()
  const [ligne, setLigne] = useState<PaiementEleve | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Filtre explicite : un admin pourrait lire toutes les lignes
    supabase.from('paiements_eleves').select(PAIEMENT_ELEVE_COLUMNS).eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        const p = data as PaiementEleve | null
        setLigne(p && { ...p, versements: [...p.versements].sort((a, b) => b.date.localeCompare(a.date)) })
        setLoading(false)
      })
  }, [user.id])

  const reste = ligne ? resteAPayer(ligne) : 0

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Mes paiements</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Le montant total de votre inscription et les versements déjà reçus.</p>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : !ligne ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucun paiement à afficher pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <Total label="Montant total" value={formatEuros(ligne.montant_du)} />
            <Total label="Déjà réglé" value={formatEuros(totalPaye(ligne))} color="#4db8aa" />
            <Total label="Reste à régler" value={formatEuros(reste)} color={reste > 0 ? '#cf3594' : 'rgba(255,255,255,0.5)'} />
          </div>

          {statutPaiement(ligne) === 'solde' && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4db8aa' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>check_circle</span>
              {STATUT_LABELS.solde} : merci, tout est réglé.
            </p>
          )}

          {ligne.commentaire && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{ligne.commentaire}</p>
          )}

          <div style={card}>
            <SectionTitle>Versements reçus</SectionTitle>
            {ligne.versements.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Aucun versement enregistré pour le moment.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                {ligne.versements.map((v, i) => (
                  <li key={v.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.4rem 1rem', padding: '0.75rem 0', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', minWidth: '8.5rem' }}>{formatDay(v.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span style={{ fontWeight: 600 }}>{formatEuros(v.montant)}</span>
                    {(v.moyen_paiement || v.commentaire) && (
                      <span style={{ flex: '1 1 100%', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                        {[v.moyen_paiement, v.commentaire].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Total({ label, value, color = '#fff' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ ...card, padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
