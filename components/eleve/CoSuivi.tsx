'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { Modal, btnAccent, btnGhost, input } from '@/components/ManagerUI'
import { COMMENTAIRE_COLUMNS, chargerCoSuivi, dateCourte, lienLecture, notifier, titreDevoir, type Commentaire, type DonneesCoSuivi, type Enregistrement } from '@/lib/co-suivi'
import type { Devoir } from '@/lib/devoirs'

// Co-suivi Formation Focus : les enregistrements des devoirs, en cartes rangées par devoir, que tout le groupe
// écoute et commente. Filtres combinables par personne et par devoir. Les commentaires s'ouvrent dans une modale
// (avec le lecteur). Espace élève (/eleve/formation-focus/co-suivi) et /admin → Formation Focus → Co-suivi
// (admin : commentaires publics ou réservés à l'élève concerné, changement de visibilité).

export default function CoSuivi({ admin = false }: { admin?: boolean }) {
  const [donnees, setDonnees] = useState<DonneesCoSuivi | null>(null)
  const [moi, setMoi] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [personne, setPersonne] = useState('') // user_id, ou '' pour tout le groupe
  const [devoirFiltre, setDevoirFiltre] = useState('') // devoir_id, ou '' pour tous
  const [ouvert, setOuvert] = useState<string | null>(null) // enregistrement dont les commentaires sont ouverts

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

  // Personnes et devoirs ayant au moins un enregistrement, pour les filtres
  const eleves = useMemo(() => {
    if (!donnees) return []
    const ids = [...new Set(donnees.enregistrements.map(e => e.user_id))]
    return ids.map(id => ({ id, nom: donnees.membres.get(id)?.nom ?? 'Élève' })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [donnees])
  const devoirsAvecRendus = useMemo(() => {
    if (!donnees) return []
    const ids = new Set(donnees.enregistrements.map(e => e.devoir_id))
    return donnees.devoirs.filter(d => ids.has(d.id)).sort((a, b) => b.date_limite.localeCompare(a.date_limite))
  }, [donnees])

  const parDevoir = useMemo(() => {
    if (!donnees) return []
    return devoirsAvecRendus
      .filter(d => !devoirFiltre || d.id === devoirFiltre)
      .map(d => ({
        devoir: d,
        enregistrements: donnees.enregistrements
          .filter(e => e.devoir_id === d.id && (!personne || e.user_id === personne))
          .sort((a, b) => (donnees.membres.get(a.user_id)?.nom ?? '').localeCompare(donnees.membres.get(b.user_id)?.nom ?? '', 'fr')),
      }))
      .filter(x => x.enregistrements.length > 0)
  }, [donnees, devoirsAvecRendus, personne, devoirFiltre])
  const nbAffiches = parDevoir.reduce((n, x) => n + x.enregistrements.length, 0)

  function ajouterCommentaire(c: Commentaire) {
    setDonnees(d => d && { ...d, commentaires: [...d.commentaires, c] })
  }
  function remplacerCommentaire(c: Commentaire) {
    setDonnees(d => d && { ...d, commentaires: d.commentaires.map(x => (x.id === c.id ? c : x)) })
  }
  function retirerCommentaire(id: string) {
    setDonnees(d => d && { ...d, commentaires: d.commentaires.filter(x => x.id !== id) })
  }

  const enregistrementOuvert = donnees?.enregistrements.find(e => e.id === ouvert) ?? null
  const devoirOuvert = enregistrementOuvert ? donnees!.devoirs.find(d => d.id === enregistrementOuvert.devoir_id) ?? null : null
  const select: React.CSSProperties = { ...input, padding: '0.5rem 0.7rem', fontSize: '0.85rem', flex: '1 1 200px', maxWidth: 320 }
  const opt = { background: '#1a0b2e' }

  return (
    <div style={{ maxWidth: 1200 }}>
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
          {/* Filtres : personne ET devoir */}
          <div role="search" aria-label="Filtrer les enregistrements" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '0.9rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)' }}>filter_list</span>
            <select value={personne} onChange={e => setPersonne(e.target.value)} aria-label="Filtrer par personne" style={select}>
              <option value="" style={opt}>Toutes les personnes</option>
              {eleves.map(e => <option key={e.id} value={e.id} style={opt}>{e.id === moi ? `${e.nom} (moi)` : e.nom}</option>)}
            </select>
            <select value={devoirFiltre} onChange={e => setDevoirFiltre(e.target.value)} aria-label="Filtrer par devoir" style={select}>
              <option value="" style={opt}>Tous les devoirs</option>
              {devoirsAvecRendus.map(d => <option key={d.id} value={d.id} style={opt}>{dateCourte(d.date_limite)} · {titreDevoir(d, donnees.exercices)}</option>)}
            </select>
            {moi && eleves.some(e => e.id === moi) && personne !== moi && (
              <button type="button" onClick={() => setPersonne(moi)} style={{ ...btnGhost, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Mes devoirs</button>
            )}
            {(personne || devoirFiltre) && (
              <button type="button" onClick={() => { setPersonne(''); setDevoirFiltre('') }} style={{ ...btnGhost, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>close</span>
                Effacer les filtres
              </button>
            )}
            <span role="status" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              {nbAffiches} enregistrement{nbAffiches > 1 ? 's' : ''}
            </span>
          </div>

          {parDevoir.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucun enregistrement pour cette personne et ce devoir.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {parDevoir.map(({ devoir, enregistrements }) => (
                <section key={devoir.id} aria-labelledby={`devoir-${devoir.id}`}>
                  <h3 id={`devoir-${devoir.id}`} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.25rem 0.6rem', fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.8rem' }}>
                    <span style={{ color: '#8b6fd1' }}>Devoir du {dateCourte(devoir.date_limite)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{titreDevoir(devoir, donnees.exercices)}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                      {enregistrements.length} enregistrement{enregistrements.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
                    {enregistrements.map(e => (
                      <li key={e.id} style={{ display: 'flex' }}>
                        <CarteEnregistrement enregistrement={e} devoir={devoir} donnees={donnees} moi={moi} onOuvrir={() => setOuvert(e.id)} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {donnees && enregistrementOuvert && devoirOuvert && (
        <Modal
          title={`${donnees.membres.get(enregistrementOuvert.user_id)?.nom ?? 'Élève'} · devoir du ${dateCourte(devoirOuvert.date_limite)}`}
          subtitle={titreDevoir(devoirOuvert, donnees.exercices)}
          onClose={() => setOuvert(null)}
        >
          <Lecteur enregistrement={enregistrementOuvert} />
          <FilCommentaires
            enregistrement={enregistrementOuvert}
            auteurEnregistrement={donnees.membres.get(enregistrementOuvert.user_id)?.nom ?? 'Élève'}
            commentaires={donnees.commentaires.filter(c => c.enregistrement_id === enregistrementOuvert.id)}
            donnees={donnees}
            moi={moi}
            admin={admin}
            onAjout={ajouterCommentaire}
            onModif={remplacerCommentaire}
            onSuppr={retirerCommentaire}
          />
        </Modal>
      )}
    </div>
  )
}

/** Bouton « Écouter » qui devient le lecteur audio (ou vidéo) une fois le lien de lecture obtenu. */
function Lecteur({ enregistrement: e, compact = false }: { enregistrement: Enregistrement; compact?: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const video = e.mime_type?.startsWith('video/')

  async function ecouter() {
    setChargement(true)
    setErreur('')
    try { setUrl(await lienLecture(e.id)) } catch (err) { setErreur(`Lecture impossible : ${err instanceof Error ? err.message : 'erreur'}`) }
    setChargement(false)
  }

  return (
    <div>
      {url ? (
        video
          ? <video src={url} controls autoPlay playsInline style={{ display: 'block', width: '100%', maxHeight: compact ? 220 : 420, borderRadius: '0.6rem', background: '#000' }} />
          : <audio src={url} controls autoPlay style={{ display: 'block', width: '100%' }} />
      ) : (
        <button
          type="button"
          onClick={ecouter}
          disabled={chargement}
          style={{ ...btnAccent, width: '100%', justifyContent: 'center', padding: compact ? '0.55rem 0.9rem' : '0.65rem 1rem', fontSize: '0.85rem', opacity: chargement ? 0.6 : 1 }}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>{chargement ? 'hourglass_top' : 'play_arrow'}</span>
          {chargement ? 'Chargement… (quelques secondes)' : video ? 'Regarder' : 'Écouter'}
        </button>
      )}
      {erreur && <p role="alert" style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{erreur}</p>}
    </div>
  )
}

function CarteEnregistrement({ enregistrement: e, devoir, donnees, moi, onOuvrir }: {
  enregistrement: Enregistrement
  devoir: Devoir
  donnees: DonneesCoSuivi
  moi: string | null
  onOuvrir: () => void
}) {
  const commentaires = donnees.commentaires.filter(c => c.enregistrement_id === e.id)
  const dernier = commentaires[commentaires.length - 1]
  const auteur = donnees.membres.get(e.user_id)?.nom ?? 'Élève'
  const estMoi = e.user_id === moi
  const prives = commentaires.filter(c => !c.public).length

  return (
    <article
      aria-label={`Enregistrement de ${auteur} pour le devoir du ${dateCourte(devoir.date_limite)}`}
      style={{ ...card, padding: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem', border: estMoi ? '1px solid rgba(207,53,148,0.45)' : card.border }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', background: estMoi ? 'linear-gradient(135deg, #cf3594, #8b6fd1)' : 'linear-gradient(135deg, #5b2ab5, #4db8c8)' }}>
          {auteur.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{auteur}{estMoi ? ' (moi)' : ''}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.nom}>{e.nom}</div>
        </div>
      </div>

      <Lecteur enregistrement={e} compact />

      {/* Aperçu du dernier commentaire */}
      <div style={{ flex: 1, minHeight: '2.6rem', fontSize: '0.8rem', lineHeight: 1.45, color: 'rgba(255,255,255,0.6)' }}>
        {dernier ? (
          <p style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            <strong style={{ color: donnees.membres.get(dernier.auteur_id)?.admin ? '#cf3594' : 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {donnees.membres.get(dernier.auteur_id)?.nom ?? 'Élève'} :
            </strong>{' '}
            {dernier.contenu}
          </p>
        ) : (
          <p style={{ margin: 0, fontStyle: 'italic', color: 'rgba(255,255,255,0.35)' }}>Pas encore de commentaire.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onOuvrir}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', padding: '0.5rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)' }}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>forum</span>
        {commentaires.length ? `${commentaires.length} commentaire${commentaires.length > 1 ? 's' : ''}` : 'Commenter'}
        {prives > 0 && <span title="Dont des commentaires privés" className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15, color: '#f0a830' }}>lock</span>}
      </button>
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
