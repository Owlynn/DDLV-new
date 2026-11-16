'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { card } from '@/components/eleve/ui'
import { FOCUS_PLAYLIST_ID, FOCUS_PLAYLIST_URL, formatDay } from '@/lib/formation-focus'
import { FOCUS_SEANCE_COLUMNS, toFocusSeance, type FocusSeance } from '@/lib/focus-seances'
import { fetchFocusVideos, seanceDeVideo, videoDate, videoLabel, videoThumbnail, type FocusVideo } from '@/lib/focus-videos'

// Vidéos de la Formation Focus, façon YouTube : le lecteur à gauche, la liste de la playlist à droite
// (en dessous sur mobile). Chaque vidéo est reliée à la séance de même date (date AAMMJJ dans le titre).
// Utilisé par /eleve/formation-focus/videos et /admin → Formation Focus → Vidéos.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

let ytApi: Promise<any> | null = null
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  ytApi ??= new Promise(resolve => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT) }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  })
  return ytApi
}

export default function FocusVideos({ seanceHref }: {
  /** Lien vers une séance ; sans lui, la séance est affichée sans lien. */
  seanceHref?: (seanceId: string) => string
}) {
  const [videos, setVideos] = useState<FocusVideo[]>([])
  const [seances, setSeances] = useState<FocusSeance[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const playerHost = useRef<HTMLDivElement>(null)
  const player = useRef<any>(null)
  const videosRef = useRef<FocusVideo[]>([])

  useEffect(() => {
    async function load() {
      const [v, s] = await Promise.all([
        fetchFocusVideos().catch(() => null),
        supabase.from('focus_seances').select(FOCUS_SEANCE_COLUMNS).eq('publiee', true),
      ])
      if (!v) setError('La liste des vidéos est indisponible pour le moment.')
      const list = v ?? []
      videosRef.current = list
      setVideos(list)
      setSeances((s.data ?? []).map(toFocusSeance))
      const wanted = new URLSearchParams(window.location.search).get('v')
      setCurrentId(list.find(x => x.id === wanted)?.id ?? list[0]?.id ?? null)
      setLoading(false)
    }
    load()
  }, [])

  // Lecteur YouTube (IFrame API), créé une fois la liste chargée : suit la vidéo en cours, y compris en lecture automatique
  const ready = !loading
  useEffect(() => {
    if (!ready || !playerHost.current) return
    let cancelled = false
    const startIndex = Math.max(0, videosRef.current.findIndex(v => v.id === currentId))
    loadYouTubeApi().then(YT => {
      if (cancelled || !playerHost.current) return
      // Élément créé hors de React : l'API le remplace par l'iframe
      const el = document.createElement('div')
      playerHost.current.appendChild(el)
      player.current = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        playerVars: { listType: 'playlist', list: FOCUS_PLAYLIST_ID, index: startIndex, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: () => {
            const id = player.current?.getVideoData?.()?.video_id
            if (id) setCurrentId(id)
          },
        },
      })
    })
    const host = playerHost.current
    return () => { cancelled = true; player.current?.destroy?.(); player.current = null; host.replaceChildren() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  function play(v: FocusVideo, index: number) {
    setCurrentId(v.id)
    const p = player.current
    if (!p?.playVideoAt) return
    const playlist: string[] | undefined = p.getPlaylist?.()
    const i = playlist?.indexOf(v.id) ?? -1
    if (i >= 0) p.playVideoAt(i)
    else if (playlist?.length) p.playVideoAt(index)
    else p.loadVideoById(v.id)
  }

  const current = videos.find(v => v.id === currentId) ?? null
  const currentDate = current ? videoDate(current) : null
  const currentSeance = current ? seanceDeVideo(seances, current) : null

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Vidéos</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Formation Focus 2026-2027 · les enregistrements des séances</p>
      </div>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
        {/* Lecteur */}
        <div className="flex-1 min-w-0">
          <section style={{ ...card, padding: 0 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
              {loading ? (
                <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>Chargement…</p>
              ) : (
                <div ref={playerHost} style={{ position: 'absolute', inset: 0 }} />
              )}
            </div>
          </section>

          {current && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>{videoLabel(current)}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                {currentDate && <span>{formatDay(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                {currentSeance && (
                  seanceHref ? (
                    <Link href={seanceHref(currentSeance.id)} style={seancePill}>
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>event_note</span>
                      Voir la séance{currentSeance.theme.trim() ? ` « ${currentSeance.theme.trim()} »` : ''}
                    </Link>
                  ) : (
                    <span style={seancePill}>
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>event_note</span>
                      Séance{currentSeance.theme.trim() ? ` « ${currentSeance.theme.trim()} »` : ` du ${currentSeance.date.trim()}`}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <a href={FOCUS_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>open_in_new</span>
            Ouvrir sur YouTube
          </a>
        </div>

        {/* Liste de la playlist */}
        {videos.length > 0 && (
          <aside aria-label="Vidéos de la playlist" className="w-full lg:w-[380px] shrink-0" style={{ ...card, padding: 0 }}>
            <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Formation Focus 2026-2027</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
                {current ? `${videos.indexOf(current) + 1} / ` : ''}{videos.length} vidéos
              </div>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: '0.4rem', maxHeight: 'min(70vh, 560px)', overflowY: 'auto' }}>
              {videos.map((v, i) => {
                const active = v.id === currentId
                const d = videoDate(v)
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => play(v, i)}
                      aria-current={active ? 'true' : undefined}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', width: '100%', padding: '0.45rem', borderRadius: '0.6rem', border: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', background: active ? 'rgba(207,53,148,0.16)' : 'transparent' }}
                    >
                      <span style={{ width: '1.1rem', flexShrink: 0, alignSelf: 'center', fontSize: '0.7rem', color: active ? '#cf3594' : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        {active ? '▶' : i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={videoThumbnail(v.id)} alt="" loading="lazy" style={{ width: 120, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: '0.4rem', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.82rem', lineHeight: 1.35, fontWeight: 600, color: '#fff' }}>
                          {v.title ? videoLabel(v) : 'Vidéo'}
                        </span>
                        {d && <span style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{formatDay(d, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>
        )}
      </div>
    </div>
  )
}

const seancePill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 999,
  fontSize: '0.8rem', color: '#fff', textDecoration: 'none', border: '1px solid rgba(207,53,148,0.5)', background: 'rgba(207,53,148,0.12)',
}
