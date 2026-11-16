import { NextResponse } from 'next/server'
import { FOCUS_PLAYLIST_ID } from '@/lib/formation-focus'
import type { FocusVideo } from '@/lib/focus-videos'

// Liste des vidéos de la playlist YouTube Formation Focus, sans clé d'API :
// les ids (dans l'ordre de la playlist) sont lus dans la page publique de la playlist,
// les titres via l'endpoint oEmbed officiel de YouTube. Mis en cache 1 h.
export const revalidate = 3600

const HEADERS = {
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Cookie: 'SOCS=CAI; CONSENT=YES+', // évite la page de consentement cookies (UE)
}

export async function GET() {
  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${FOCUS_PLAYLIST_ID}`, { headers: HEADERS, next: { revalidate } })
    if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`)
    const html = await res.text()

    // "watchEndpoint":{"videoId":"…","playlistId":"<notre playlist>","index":4
    const re = new RegExp(`"watchEndpoint":\\{"videoId":"([\\w-]{11})","playlistId":"${FOCUS_PLAYLIST_ID}","index":(\\d+)`, 'g')
    const byIndex = new Map<number, string>()
    for (const m of html.matchAll(re)) if (!byIndex.has(+m[2])) byIndex.set(+m[2], m[1])
    const ids = [...new Set([...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, id]) => id))]

    const videos: FocusVideo[] = await Promise.all(ids.map(async id => {
      try {
        const o = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { next: { revalidate } })
        return { id, title: o.ok ? (await o.json()).title as string : '' }
      } catch {
        return { id, title: '' }
      }
    }))

    return NextResponse.json({ videos })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur inconnue', videos: [] }, { status: 502 })
  }
}
