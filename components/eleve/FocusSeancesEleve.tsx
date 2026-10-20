'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { ExerciceDetail, Modal } from '@/components/ManagerUI'
import { SeancesList } from '@/components/FocusSeancesManager'
import { FOCUS_SEANCE_COLUMNS, PILIERS, PILIER_COLORS, toFocusSeance, type FocusSeance } from '@/lib/focus-seances'
import { EXERCICE_COLUMNS, fetchNotions, notionLabels, type Exercice, type Notion } from '@/lib/suivi'

// Espace élève Formation Focus : les séances publiées depuis /admin → Préparation des séances Focus, en lecture seule.
// La RLS ne renvoie aux élèves que les séances publiées ; le filtre `publiee` montre aussi aux admins la vue élève.

export default function FocusSeancesEleve() {
  const [seances, setSeances] = useState<FocusSeance[]>([])
  const [exercices, setExercices] = useState<Map<string, Exercice>>(new Map())
  const [notions, setNotions] = useState<Map<string, Notion>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openedExo, setOpenedExo] = useState<Exercice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selected = seances.find(s => s.id === selectedId) ?? null

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('focus_seances').select(FOCUS_SEANCE_COLUMNS).eq('publiee', true).order('ordre').order('created_at')
      if (error) { setError(`Chargement impossible : ${error.message}`); setLoading(false); return }
      const list = (data ?? []).map(toFocusSeance)
      setSeances(list)
      setSelectedId(list[list.length - 1]?.id ?? null) // la plus récente

      const ids = [...new Set(list.flatMap(s => Object.values(s.exercices).flat()))].filter((id): id is string => !!id)
      const [e, n] = await Promise.all([
        ids.length ? supabase.from('exercices').select(EXERCICE_COLUMNS).in('id', ids) : Promise.resolve({ data: [] }),
        fetchNotions(),
      ])
      setExercices(new Map(((e.data ?? []) as Exercice[]).map(x => [x.id, x])))
      setNotions(new Map(n.map(x => [x.id, x])))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="focus-seances" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Séances</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Le contenu de chaque séance, pilier par pilier, et les exercices travaillés.</p>
      </div>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : !selected ? (
        !error && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Aucune séance n'est encore disponible.</p>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <SeancesList seances={seances} selectedId={selected.id} onSelect={setSelectedId} showPublication={false} />
          <SeanceDetail key={selected.id} seance={selected} exercices={exercices} onOpenExercice={setOpenedExo} />
        </div>
      )}

      {openedExo && (
        <Modal title={openedExo.titre} subtitle="Exercice" onClose={() => setOpenedExo(null)}>
          <ExerciceDetail exercice={openedExo} notions={notionLabels(openedExo, notions)} />
        </Modal>
      )}
    </div>
  )
}

function SeanceDetail({ seance, exercices, onOpenExercice }: {
  seance: FocusSeance
  exercices: Map<string, Exercice>
  onOpenExercice: (e: Exercice) => void
}) {
  // Un pilier sans texte ni exercice n'est pas affiché
  const piliers = PILIERS
    .map(p => ({
      ...p,
      texte: seance.piliers[p.key]?.trim() ?? '',
      exos: (seance.exercices[p.key] ?? []).map(id => exercices.get(id)).filter((e): e is Exercice => !!e),
    }))
    .filter(p => p.texte || p.exos.length)

  return (
    <article aria-labelledby="focus-seance-titre" className="flex-1 min-w-0" style={{ ...card, padding: '1.5rem' }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>
          Séance {seance.date.trim() ? `du ${seance.date.trim()}` : ''}
        </div>
        <h3 id="focus-seance-titre" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          {seance.theme.trim() || 'Sans thème'}
        </h3>
      </header>

      {piliers.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>Le contenu de cette séance arrive bientôt.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {piliers.map(p => {
            const color = PILIER_COLORS[p.key]
            const rang = PILIERS.findIndex(x => x.key === p.key) + 1
            return (
              <li key={p.key} style={{ paddingLeft: '1rem', borderLeft: `3px solid ${color}99` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: '1.6rem', height: '1.6rem', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color, background: `${color}26`, border: `1px solid ${color}66` }}>
                    {rang}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.92)', margin: 0 }}>{p.label}</h4>
                    {p.sousTitre && <div style={{ fontSize: '0.75rem', color, marginTop: '0.15rem' }}>{p.sousTitre}</div>}
                  </div>
                </div>

                {p.texte && (
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap', margin: 0 }}>{p.texte}</p>
                )}

                {p.exos.length > 0 && (
                  <div style={{ marginTop: p.texte ? '0.9rem' : 0 }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.45rem' }}>Exercices</div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {p.exos.map(e => (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => onOpenExercice(e)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', color: '#fff', border: `1px solid ${color}66`, background: `${color}1a` }}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15, color }}>library_music</span>
                            {e.titre}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </article>
  )
}
