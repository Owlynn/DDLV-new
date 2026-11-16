'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { btnAccent, btnGhost, input, normaliser, th, td } from '@/components/ManagerUI'
import { ENREGISTREMENT_COLUMNS, chargerCoSuivi, dateCourte, enTeteAuth, titreDevoir, type DonneesCoSuivi, type Enregistrement } from '@/lib/co-suivi'
import { FOCUS_DRIVE_URL } from '@/lib/formation-focus'

// /admin → Formation Focus → Co-suivi → Fichiers du Drive : chaque fichier déposé sur le Drive Focus est attribué
// à un élève et à un devoir ; il apparaît alors dans le co-suivi. Le Drive est lu par le script Google Apps Script
// scripts/drive-focus.gs (app/api/admin/drive/files/route.ts).

interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; size?: string; dossier: string }
type Filtre = 'a-attribuer' | 'tous'

export default function DriveAttribution({ onChange }: { onChange?: () => void }) {
  const [files, setFiles] = useState<DriveFile[] | null>(null)
  const [nonConfigure, setNonConfigure] = useState(false)
  const [donnees, setDonnees] = useState<DonneesCoSuivi | null>(null)
  const [error, setError] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('a-attribuer')
  const [search, setSearch] = useState('')
  const [chargement, setChargement] = useState(false)

  async function load() {
    setChargement(true)
    setError('')
    const [res, d] = await Promise.all([
      fetch('/api/admin/drive/files', { headers: await enTeteAuth() }).then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })),
      chargerCoSuivi().catch(e => { setError(e.message); return null }),
    ])
    setDonnees(d)
    setNonConfigure(res.body.code === 'non_configure')
    if (!res.ok) { setError(res.body.error ?? 'Lecture du Drive impossible'); setFiles([]) }
    else setFiles(res.body.files as DriveFile[])
    setChargement(false)
  }
  useEffect(() => { load() }, [])

  const parFichier = useMemo(() => new Map((donnees?.enregistrements ?? []).map(e => [e.drive_file_id, e])), [donnees])
  const eleves = useMemo(
    () => [...(donnees?.membres.values() ?? [])].filter(m => !m.admin).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [donnees],
  )
  const devoirs = donnees?.devoirs ?? []

  const q = normaliser(search)
  const shown = (files ?? []).filter(f =>
    (filtre === 'tous' || !parFichier.has(f.id)) && (!q || normaliser(`${f.name} ${f.dossier}`).includes(q)))
  const restants = (files ?? []).filter(f => !parFichier.has(f.id)).length

  /** Devine l'élève (prénom dans le nom du fichier ou du dossier) et le devoir (première date limite ≥ date du fichier). */
  function suggestion(f: DriveFile) {
    const texte = normaliser(`${f.dossier} ${f.name}`)
    const eleve = eleves.find(e => {
      const prenom = normaliser(e.nom.split(' ')[0] ?? '')
      return prenom.length >= 3 && new RegExp(`(^|[^a-z])${prenom}([^a-z]|$)`).test(texte)
    })
    const jour = f.modifiedTime.slice(0, 10)
    const devoir = devoirs.find(d => d.date_limite >= jour) ?? devoirs[devoirs.length - 1]
    return { eleveId: eleve?.user_id ?? '', devoirId: devoir?.id ?? '' }
  }

  async function attribuer(f: DriveFile, userId: string, devoirId: string) {
    setError('')
    const { data, error } = await supabase.from('devoirs_enregistrements')
      .insert({ drive_file_id: f.id, nom: f.name, mime_type: f.mimeType, user_id: userId, devoir_id: devoirId })
      .select(ENREGISTREMENT_COLUMNS).single()
    if (error || !data) { setError(`Attribution impossible : ${error?.message ?? 'erreur inconnue'}`); return false }
    setDonnees(d => d && { ...d, enregistrements: [...d.enregistrements, data as Enregistrement] })
    onChange?.()
    return true
  }

  async function retirer(e: Enregistrement) {
    setError('')
    const { data, error } = await supabase.from('devoirs_enregistrements').delete().eq('id', e.id).select('id')
    if (error || !data?.length) { setError(`Retrait impossible : ${error?.message ?? 'accès refusé'}`); return }
    setDonnees(d => d && { ...d, enregistrements: d.enregistrements.filter(x => x.id !== e.id), commentaires: d.commentaires.filter(c => c.enregistrement_id !== e.id) })
    onChange?.()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Fichiers du Drive</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
            Attribuez chaque fichier déposé sur le <a href={FOCUS_DRIVE_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(207,53,148,0.9)' }}>Drive Focus</a> à un élève et à un devoir : il apparaît alors dans le co-suivi.
          </p>
        </div>
        <button type="button" onClick={load} disabled={chargement} style={{ ...btnGhost, opacity: chargement ? 0.6 : 1 }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>refresh</span>
          {chargement ? 'Lecture du Drive…' : 'Actualiser'}
        </button>
      </div>

      {nonConfigure ? (
        <ConfigurationDrive />
      ) : (
        <>
          {error && (
            <div role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
              {files?.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0.4rem 0 0' }}>
                  Vérifiez l’URL du script (elle finit par <code>/exec</code>), que le déploiement est en accès « Tout le monde », et que le jeton est le même dans le script et dans Vercel.
                </p>
              )}
            </div>
          )}

          {files === null ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Lecture du Drive…</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div role="group" aria-label="Fichiers affichés" style={{ display: 'inline-flex', padding: 3, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)' }}>
                  {([['a-attribuer', `À attribuer (${restants})`], ['tous', `Tous (${files.length})`]] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setFiltre(v)} aria-pressed={filtre === v} style={{ padding: '0.3rem 0.8rem', borderRadius: 999, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', color: filtre === v ? '#fff' : 'rgba(255,255,255,0.55)', background: filtre === v ? 'rgba(207,53,148,0.3)' : 'transparent' }}>{l}</button>
                  ))}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un fichier ou un dossier…" aria-label="Rechercher un fichier" style={{ ...input, flex: '1 1 240px', maxWidth: 360 }} />
              </div>

              {shown.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  {filtre === 'a-attribuer' && !q ? 'Tous les fichiers du Drive sont attribués. 🎉' : 'Aucun fichier ne correspond.'}
                </p>
              ) : (
                <div style={{ ...card, padding: 0, overflow: 'visible' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left' }}>
                        <th style={th}>Fichier</th>
                        <th className="hidden md:table-cell" style={{ ...th, width: '6.5rem' }}>Déposé le</th>
                        <th style={{ ...th, width: '46%' }}>Attribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map(f => (
                        <LigneFichier
                          key={f.id}
                          fichier={f}
                          enregistrement={parFichier.get(f.id) ?? null}
                          donnees={donnees}
                          eleves={eleves}
                          suggestion={suggestion(f)}
                          onAttribuer={(u, d) => attribuer(f, u, d)}
                          onRetirer={retirer}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function LigneFichier({ fichier: f, enregistrement, donnees, eleves, suggestion, onAttribuer, onRetirer }: {
  fichier: DriveFile
  enregistrement: Enregistrement | null
  donnees: DonneesCoSuivi | null
  eleves: { user_id: string; nom: string }[]
  suggestion: { eleveId: string; devoirId: string }
  onAttribuer: (userId: string, devoirId: string) => Promise<boolean>
  onRetirer: (e: Enregistrement) => void
}) {
  const [eleveId, setEleveId] = useState(suggestion.eleveId)
  const [devoirId, setDevoirId] = useState(suggestion.devoirId)
  const [busy, setBusy] = useState(false)
  const media = f.mimeType.startsWith('audio/') || f.mimeType.startsWith('video/')
  const select: React.CSSProperties = { ...input, padding: '0.4rem 0.5rem', fontSize: '0.8rem', minWidth: 0, flex: '1 1 8rem' }
  const opt = { background: '#1a0b2e' }

  return (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <td style={{ ...td, verticalAlign: 'top' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', minWidth: 0 }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18, color: media ? '#8b6fd1' : 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 1 }}>
            {f.mimeType.startsWith('video/') ? 'movie' : media ? 'graphic_eq' : 'draft'}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#fff', overflowWrap: 'anywhere' }}>{f.name}</div>
            {f.dossier && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>📁 {f.dossier}</div>}
            {!media && <div style={{ fontSize: '0.7rem', color: '#f0a830', marginTop: '0.1rem' }}>Pas un fichier audio ou vidéo</div>}
            <div className="md:hidden" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{dateCourte(f.modifiedTime.slice(0, 10))}</div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell" style={{ ...td, verticalAlign: 'top', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{dateCourte(f.modifiedTime.slice(0, 10))}</td>
      <td style={{ ...td, verticalAlign: 'top' }}>
        {enregistrement ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#4db8c8' }}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>check_circle</span>
              {donnees?.membres.get(enregistrement.user_id)?.nom ?? 'Élève'}
            </span>
            {(() => {
              const d = donnees?.devoirs.find(x => x.id === enregistrement.devoir_id)
              return d && <span style={{ color: 'rgba(255,255,255,0.6)' }}>Devoir du {dateCourte(d.date_limite)} · {titreDevoir(d, donnees!.exercices)}</span>
            })()}
            <button type="button" onClick={() => onRetirer(enregistrement)} title="Retirer l’attribution (le fichier reste sur le Drive ; ses commentaires sont supprimés)" style={{ ...btnGhost, padding: '0.2rem 0.6rem', fontSize: '0.72rem', marginLeft: 'auto' }}>
              Retirer
            </button>
          </div>
        ) : (
          <form
            onSubmit={async e => {
              e.preventDefault()
              if (!eleveId || !devoirId || busy) return
              setBusy(true)
              await onAttribuer(eleveId, devoirId)
              setBusy(false)
            }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}
          >
            <select value={eleveId} onChange={e => setEleveId(e.target.value)} aria-label={`Élève pour « ${f.name} »`} style={select}>
              <option value="" style={opt}>Élève…</option>
              {eleves.map(e => <option key={e.user_id} value={e.user_id} style={opt}>{e.nom}</option>)}
            </select>
            <select value={devoirId} onChange={e => setDevoirId(e.target.value)} aria-label={`Devoir pour « ${f.name} »`} style={select}>
              <option value="" style={opt}>Devoir…</option>
              {(donnees?.devoirs ?? []).map(d => <option key={d.id} value={d.id} style={opt}>{dateCourte(d.date_limite)} · {titreDevoir(d, donnees!.exercices)}</option>)}
            </select>
            <button type="submit" disabled={!eleveId || !devoirId || busy} style={{ ...btnAccent, padding: '0.4rem 0.8rem', fontSize: '0.78rem', opacity: eleveId && devoirId && !busy ? 1 : 0.5 }}>
              {busy ? '…' : 'Attribuer'}
            </button>
          </form>
        )}
      </td>
    </tr>
  )
}

/** Mode d'emploi tant que le script Google n'est pas branché. */
function ConfigurationDrive() {
  const etape: React.CSSProperties = { margin: '0 0 0.6rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }
  return (
    <section style={{ ...card }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: 0 }}>Connecter le Drive Focus (gratuit, sans carte bancaire)</h3>
      <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
        <li style={etape}>Avec le compte Google propriétaire du dossier Focus, ouvrez <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener noreferrer" style={{ color: '#cf3594' }}>script.google.com</a> (nouveau projet).</li>
        <li style={etape}>Remplacez le code par celui du fichier <code>scripts/drive-focus.gs</code>, et collez le jeton secret dans <code>JETON</code>. Enregistrez.</li>
        <li style={etape}>« Déployer » → « Nouveau déploiement » → type « Application Web » : exécuter en tant que « Moi », accès « Tout le monde ». Autorisez l’accès au Drive quand Google le demande, puis copiez l’URL qui finit par <code>/exec</code>.</li>
        <li style={etape}>Ajoutez <code>GOOGLE_APPS_SCRIPT_URL</code> (cette URL) et <code>GOOGLE_APPS_SCRIPT_TOKEN</code> (le jeton) dans Vercel → Settings → Environment Variables, puis redéployez (et dans <code>.env.local</code> pour le site en local).</li>
      </ol>
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
        « Tout le monde » veut dire que l’URL répond sans connexion Google : le script refuse toute demande sans le jeton secret, et ne lit que le dossier Focus.
      </p>
    </section>
  )
}
