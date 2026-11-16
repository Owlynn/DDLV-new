// Vidéos de la playlist YouTube Formation Focus (servies par app/api/focus-videos/route.ts)
// et rattachement à une séance (table focus_seances) par la date contenue dans le titre :
// les titres suivent le format « 5 - 261021 - prendre le temps (2) » (AAMMJJ).

import { isoDate, parseFrenchDate, seanceDates, type FocusSeance } from '@/lib/focus-seances'

export interface FocusVideo {
  id: string // id de la vidéo YouTube
  title: string // titre brut sur YouTube
}

/** Date de la vidéo (AAAA-MM-JJ) lue dans son titre (« 261021 », « 20261025 » ou « 4 novembre 2026 »), ou null. */
export function videoDate(v: FocusVideo): string | null {
  const long = v.title.match(/(?:^|\D)(20\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (long) return isoDate(+long[1], +long[2], +long[3])
  const court = v.title.match(/(?:^|\D)(\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (court) return isoDate(2000 + +court[1], +court[2], +court[3])
  return parseFrenchDate(v.title)
}

/** Titre sans le préfixe « n° - date - » (garde le titre entier s'il n'y a rien après la date). */
export function videoLabel(v: FocusVideo): string {
  return v.title.replace(/^\s*\d+\s*[-–]\s*\d{6,8}\s*[-–]\s*/, '').replace(/^\s*\d+\s*[-–]\s*(?=\d{1,2}(?:er)?\s+[a-zéû])/i, '').trim() || v.title
}

export function videoThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}


/** Les vidéos rattachées à une séance (même jour, ou un des jours d'un week-end). */
export function videosDeSeance(videos: FocusVideo[], s: FocusSeance) {
  const jours = seanceDates(s)
  return videos.filter(v => { const d = videoDate(v); return !!d && jours.includes(d) })
}

/** La séance d'une vidéo (même jour), s'il y en a une. */
export function seanceDeVideo(seances: FocusSeance[], v: FocusVideo) {
  const d = videoDate(v)
  return d ? seances.find(s => seanceDates(s).includes(d)) ?? null : null
}

export async function fetchFocusVideos(): Promise<FocusVideo[]> {
  const res = await fetch('/api/focus-videos')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()).videos as FocusVideo[]
}
