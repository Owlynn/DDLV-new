'use client'

import { FOCUS_PLAYLIST_ID, FOCUS_PLAYLIST_URL } from '@/lib/formation-focus'
import { card } from '@/components/eleve/ui'

// Playlist YouTube de la Formation Focus : espace élève et /admin → Formation Focus.
export default function FocusPlaylist() {
  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Playlist</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Formation Focus 2026-2027 · les vidéos de la formation</p>
      </div>

      <section style={{ ...card, padding: 0 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${FOCUS_PLAYLIST_ID}`}
            title="Playlist Formation Focus"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </section>

      <a href={FOCUS_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(207,53,148,0.9)', textDecoration: 'none' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
        Ouvrir la playlist sur YouTube
      </a>
    </div>
  )
}
