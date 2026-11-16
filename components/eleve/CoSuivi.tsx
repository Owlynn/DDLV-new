'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { btnAccent, input } from '@/components/ManagerUI'
import { COMMENTAIRE_COLUMNS, chargerCoSuivi, dateCourte, lienLecture, notifier, titreDevoir, type Commentaire, type DonneesCoSuivi, type Enregistrement } from '@/lib/co-suivi'
import type { Devoir } from '@/lib/devoirs'

// Co-suivi Formation Focus : les enregistrements des devoirs, rangés par devoir, que tout le groupe écoute et commente.
// Espace élève (/eleve/formation-focus/co-suivi) et /admin → Formation Focus → Co-suivi (admin : commentaires
// publics ou réservés à l'élève concerné, changement de visibilité).

export default function CoSuivi({ admin = false }: { admin?: boolean }) {
  const [donnees, setDonnees] = useState<DonneesCoSuivi | null>(null)
  const [moi, setMoi] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filtre, setFiltre] = useState<string | null>(null) // user_id de l'élève affiché, ou tous

  async function load() {
    try {
      const [d, u] = await Promise.all([chargerCoSuivi(), supabase.auth.getUser()])
      setDonnees(d)
      setMoi(u.data.user?.id ?? null)
    } catch (e) {
      setError(`Chargement impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`)
    }
  }
  useEffect(() => { load() }, [])

  const parDevoir = useMemo(() => {
    if (!donnees) return []
    return donnees.devoirs
      .map(d => ({ devoir: d, enregistrements: donnees.enregistrements.filter(e => e.devoir_id === d.id && (!filtre || e.user_id === filtre)) }))
      .filter(x => x.enregistrements.length > 0)
      .sort((a, b) => b.devoir.date_limite.localeCompare(a.devoir.date_limite)) // le plus récent en haut
  }, [donnees, filtre])

  // Élèves ayant au moins un enregistrement, pour le filtre
  const eleves = useMemo(() => {
    if (!donnees) return []
    const ids = [...new Set(donnees.enregistrements.map(e => e.user_id))]
    return ids.map(id => ({ id, nom: donnees.membres.get(id)?.nom ?? 'Élève' })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [donnees])

  function ajouterCommentaire(c: Commentaire) {
    setDonnees(d => d && { ...d, commentaires: [...d.commentaires, c] })
  }
  function remplacerCommentaire(c: Commentaire) {
    setDonnees(d => d && { ...d, commentaires: d.commentaires.map(x => (x.id === c.id ? c : x)) })
  }
  function retirerCommentaire(id: string) {
    setDonnees(d => d && { ...d, commentaires: d.commentaires.filter(x => x.id !== id) })
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Co-suivi</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          Les devoirs rendus par le groupe Formation Focus : écoutez-vous les uns les autres et laissez vos retours.
        </p>
      </div>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {!donnees ? (
        !error && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : donnees.enregistrements.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
          {admin ? 'Aucun enregistrement pour l’instant : attribuez les fichiers du Drive dans l’onglet « Fichiers du Drive ».' : 'Aucun devoir n’a encore été partagé.'}
        </p>
      ) : (
        <>
          {eleves.length > 1 && (
            <div role="group" aria-label="Filtrer par élève" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {[{ id: null as string | null, nom: 'Tout le groupe' }, ...eleves].map(e => (
                <button
                  key={e.id ?? 'tous'}
                  type="button"
                  onClick={() => setFiltre(e.id)}
                  aria-pressed={filtre === e.id}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', color: '#fff', border: `1px solid ${filtre === e.id ? 'rgba(207,53,148,0.6)' : 'rgba(255,255,255,0.15)'}`, background: filtre === e.id ? 'rgba(207,53,148,0.25)' : 'rgba(255,255,255,0.04)' }}
                >
                  {e.id === moi ? `${e.nom} (moi)` : e.nom}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {parDevoir.map(({ devoir, enregistrements }) => (
              <section key={devoir.id} aria-labelledby={`devoir-${devoir.id}`}>
                <h3 id={`devoir-${devoir.id}`} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.25rem 0.6rem', fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.7rem' }}>
                  <span style={{ color: '#8b6fd1' }}>Devoir du {dateCourte(devoir.date_limite)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{titreDevoir(devoir, donnees.exercices)}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                    {enregistrements.length} enregistrement{enregistrements.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {enregistrements.map(e => (
                    <CarteEnregistrement
                      key={e.id}
                      enregistrement={e}
                      devoir={devoir}
                      donnees={donnees}
                      moi={moi}
                      admin={admin}
                      onAjout={ajouterCommentaire}
                      onModif={remplacerCommentaire}
                      onSuppr={retirerCommentaire}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CarteEnregistrement({ enregistrement: e, devoir, donnees, moi, admin, onAjout, onModif, onSuppr }: {
  enregistrement: Enregistrement
  devoir: Devoir
  donnees: DonneesCoSuivi
  moi: string | null
  admin: boolean
  onAjout: (c: Commentaire) => void
  onModif: (c: Commentaire) => void
  onSuppr: (id: string) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreurLecture, setErreurLecture] = useState('')
  const commentaires = donnees.commentaires.filter(c => c.enregistrement_id === e.id)
  const [ouvert, setOuvert] = useState(false)
  const auteur = donnees.membres.get(e.user_id)?.nom ?? 'Élève'
  const estMoi = e.user_id === moi
  const video = e.mime_type?.startsWith('video/')

  async function ecouter() {
    setChargement(true)
    setErreurLecture('')
    try { setUrl(await lienLecture(e.id)) } catch (err) { setErreurLecture(`Lecture impossible : ${err instanceof Error ? err.message : 'erreur'}`) }
    setChargement(false)
  }

  return (
    <article aria-label={`Enregistrement de ${auteur} pour le devoir du ${dateCourte(devoir.date_limite)}`} style={{ ...card, padding: '1rem 1.1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.9rem' }}>
        <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff', background: estMoi ? 'rgba(207,53,148,0.45)' : 'rgba(139,111,209,0.4)' }}>
          {auteur.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0, flex: '1 1 12rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{auteur}{estMoi ? ' (moi)' : ''}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.nom}>{e.nom}</div>
        </div>
        {!url && (
          <button type="button" onClick={ecouter} disabled={chargement} style={{ ...btnAccent, padding: '0.45rem 0.9rem', fontSize: '0.82rem', opacity: chargement ? 0.6 : 1 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>play_arrow</span>
            {chargement ? 'Chargement…' : video ? 'Regarder' : 'Écouter'}
          </button>
        )}
      </div>

      {url && (
        video
          ? <video src={url} controls autoPlay playsInline style={{ display: 'block', width: '100%', maxHeight: 420, marginTop: '0.8rem', borderRadius: '0.6rem', background: '#000' }} />
          : <audio src={url} controls autoPlay style={{ display: 'block', width: '100%', marginTop: '0.8rem' }} />
      )}
      {erreurLecture && <p role="alert" style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.6rem 0 0' }}>{erreurLecture}</p>}

      <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
        <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>forum</span>
          {commentaires.length ? `${commentaires.length} commentaire${commentaires.length > 1 ? 's' : ''}` : 'Commenter'}
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>{ouvert ? 'expand_less' : 'expand_more'}</span>
        </button>

        {ouvert && (
          <FilCommentaires
            enregistrement={e}
            auteurEnregistrement={auteur}
            commentaires={commentaires}
            donnees={donnees}
            moi={moi}
            admin={admin}
            onAjout={onAjout}
            onModif={onModif}
            onSuppr={onSuppr}
          />
        )}
      </div>
    </article>
  )
}

function FilCommentaires({ enregistrement, auteurEnregistrement, commentaires, donnees, moi, admin, onAjout, onModif, onSuppr }: {
  enregistrement: Enregistrement
  auteurEnregistrement: string
  commentaires: Commentaire[]
  donnees: DonneesCoSuivi
  moi: string | null
  admin: boolean
  onAjout: (c: Commentaire) => void
  onModif: (c: Commentaire) => void
  onSuppr: (id: string) => void
}) {
  const [texte, setTexte] = useState('')
  const [estPublic, setEstPublic] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function publier() {
    const contenu = texte.trim()
    if (!contenu || !moi || busy) return
    setBusy(true)
    setError('')
    const { data, error } = await supabase.from('devoirs_commentaires')
      .insert({ enregistrement_id: enregistrement.id, auteur_id: moi, contenu, public: admin ? estPublic : true })
      .select(COMMENTAIRE_COLUMNS).single()
    setBusy(false)
    if (error || !data) { setError(`Envoi impossible : ${error?.message ?? 'erreur inconnue'}`); return }
    onAjout(data as Commentaire)
    notifier('commentaire', (data as Commentaire).id) // e-mail à l'élève de l'enregistrement (sauf s'il s'agit de lui)
    setTexte('')
  }

  async function basculerVisibilite(c: Commentaire) {
    const { data, error } = await supabase.from('devoirs_commentaires').update({ public: !c.public, updated_at: new Date().toISOString() }).eq('id', c.id).select(COMMENTAIRE_COLUMNS).single()
    if (error || !data) { setError(`Modification impossible : ${error?.message ?? 'accès refusé'}`); return }
    onModif(data as Commentaire)
  }

  async function supprimer(c: Commentaire) {
    const { data, error } = await supabase.from('devoirs_commentaires').delete().eq('id', c.id).select('id')
    if (error || !data?.length) { setError(`Suppression impossible : ${error?.message ?? 'accès refusé'}`); return }
    onSuppr(c.id)
  }

  const quand = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  const petitBouton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.1rem 0.4rem', border: 0, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }

  return (
    <div style={{ marginTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {commentaires.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {commentaires.map(c => {
            const membre = donnees.membres.get(c.auteur_id)
            const nom = membre?.nom ?? 'Élève'
            const mien = c.auteur_id === moi
            return (
              <li key={c.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '0.6rem', background: c.public ? 'rgba(255,255,255,0.05)' : 'rgba(240,168,48,0.08)', border: `1px solid ${c.public ? 'rgba(255,255,255,0.08)' : 'rgba(240,168,48,0.35)'}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                  <strong style={{ color: membre?.admin ? '#cf3594' : '#fff', fontWeight: 600 }}>{nom}{membre?.admin ? ' · formatrice' : ''}</strong>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{quand(c.created_at)}</span>
                  {!c.public && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#f0a830' }}>
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>lock</span>
                      Visible seulement par {enregistrement.user_id === moi ? 'vous' : auteurEnregistrement}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: '0.2rem' }}>
                    {admin && (
                      <button type="button" onClick={() => basculerVisibilite(c)} style={petitBouton} title={c.public ? `Réserver ce commentaire à ${auteurEnregistrement}` : 'Rendre ce commentaire visible par tout le groupe'}>
                        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>{c.public ? 'lock' : 'public'}</span>
                        {c.public ? 'Rendre privé' : 'Rendre public'}
                      </button>
                    )}
                    {mien && (
                      <button type="button" onClick={() => supprimer(c)} style={petitBouton} title="Supprimer mon commentaire">
                        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>delete</span>
                        Supprimer
                      </button>
                    )}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.contenu}</p>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={ev => { ev.preventDefault(); publier() }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor={`commentaire-${enregistrement.id}`} className="sr-only">Votre commentaire sur l’enregistrement de {auteurEnregistrement}</label>
        <textarea
          id={`commentaire-${enregistrement.id}`}
          value={texte}
          onChange={ev => setTexte(ev.target.value)}
          onKeyDown={ev => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); publier() } }}
          rows={2}
          placeholder={admin ? `Votre retour à ${auteurEnregistrement}…` : 'Votre retour bienveillant…'}
          style={{ ...input, width: '100%', resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          {admin ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
              <input type="checkbox" checked={estPublic} onChange={ev => setEstPublic(ev.target.checked)} />
              Visible par tout le groupe
              {!estPublic && <span style={{ color: '#f0a830' }}>(seulement {auteurEnregistrement})</span>}
            </label>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Visible par tout le groupe Focus</span>
          )}
          <button type="submit" disabled={!texte.trim() || busy} style={{ ...btnAccent, padding: '0.4rem 0.9rem', fontSize: '0.8rem', opacity: texte.trim() && !busy ? 1 : 0.5 }}>
            {busy ? 'Envoi…' : 'Publier'}
          </button>
        </div>
        {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
      </form>
    </div>
  )
}
