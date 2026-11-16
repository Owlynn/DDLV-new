// Vidéos de la playlist YouTube Formation Focus (servies par app/api/focus-videos/route.ts)
// et rattachement à une séance (table focus_seances) par la date contenue dans le titre :
// les titres suivent le format « 5 - 261021 - prendre le temps (2) » (AAMMJJ).

import type { FocusSeance } from '@/lib/focus-seances'

export interface FocusVideo {
  id: string // id de la vidéo YouTube
  title: string // titre brut sur YouTube
}

function isoDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/**
 * Jours d'une séance (AAAA-MM-JJ) depuis son champ texte libre : « 21/10 », « 21/10/2026 », « 21.10.26 »,
 * « mercredi 21 octobre », et pour un week-end « 24-25/10 », « 24 et 25 octobre », « 24/10 et 25/10 »…
 * Sans année, on prend celle de la formation (oct.–déc. 2026, janv.–sept. 2027).
 */
export function seanceDates(s: FocusSeance): string[] {
  const txt = s.date.toLowerCase()
  const jours = new Set<string>()
  const add = (d: string, m: number, y?: string) => {
    const k = isoDate(y ? (y.length === 2 ? 2000 + +y : +y) : anneeFormation(m), m, +d)
    if (k) jours.add(k)
  }
  const ou = String.raw`\s*(?:-|–|et|&|au|,)\s*`

  // Numérique : « 24/10/26 », et le premier jour de « 24-25/10 »
  for (const m of txt.matchAll(/(\d{1,2})\s*[/.]\s*(\d{1,2})(?:\s*[/.]\s*(\d{2,4}))?/g)) add(m[1], +m[2], m[3])
  for (const m of txt.matchAll(new RegExp(String.raw`(\d{1,2})${ou}(?=\d{1,2}\s*[/.]\s*(\d{1,2})(?:\s*[/.]\s*(\d{2,4}))?)`, 'g'))) add(m[1], +m[2], m[3])

  // En toutes lettres : « 24 et 25 octobre 2026 »
  for (const m of txt.matchAll(new RegExp(String.raw`(\d{1,2})(?:er)?((?:${ou}\d{1,2}(?:er)?)*)\s+([a-zéû]+)(?:\s+(\d{4}))?`, 'g'))) {
    const idx = MOIS.findIndex(x => x.startsWith(m[3].slice(0, 4)))
    if (idx < 0) continue
    for (const d of [m[1], ...(m[2].match(/\d{1,2}/g) ?? [])]) add(d, idx + 1, m[4])
  }
  return [...jours]
}

/** Année d'un mois de la formation 2026-2027 (oct.–déc. 2026, janv.–sept. 2027). */
function anneeFormation(m: number) {
  return m >= 10 ? 2026 : 2027
}

/** « 4 novembre 2026 », « mercredi 1er octobre »… → AAAA-MM-JJ, ou null. */
function parseFrenchDate(text: string): string | null {
  const mot = text.toLowerCase().match(/(\d{1,2})(?:er)?\s+([a-zéû]+)(?:\s+(\d{4}))?/)
  const idx = mot ? MOIS.findIndex(x => x.startsWith(mot[2].slice(0, 4))) : -1
  if (!mot || idx < 0) return null
  return isoDate(mot[3] ? +mot[3] : anneeFormation(idx + 1), idx + 1, +mot[1])
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
