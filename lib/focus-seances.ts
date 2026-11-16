// Tables public.focus_seances et public.focus_seance_piliers (voir supabase/migrations/20261020_focus_seances.sql) :
// préparation des séances de la Formation Focus. Les admins gèrent tout ; les élèves Focus lisent les séances publiées (RLS).

import { getSessions, type FocusSession } from '@/lib/formation-focus'

export type PilierKey = 'fondations' | 'posture' | 'collectif' | 'autonome' | 'scene'

/** Les 5 piliers, dans l'ordre d'affichage. */
export const PILIERS: { key: PilierKey; label: string; sousTitre?: string }[] = [
  { key: 'fondations', label: 'Les fondations techniques', sousTitre: '1h minimum à chaque séance' },
  { key: 'posture', label: "La posture intérieure de l'improvisatrice" },
  { key: 'collectif', label: 'La dimension collective' },
  { key: 'scene', label: "L'improvisation sur scène" },
  { key: 'autonome', label: 'Le travail autonome', sousTitre: 'Les devoirs à rendre avant la prochaine séance' },
]

export interface FocusSeance {
  id: string
  date: string
  theme: string
  ordre: number
  publiee: boolean // visible par les élèves Focus (lecture seule)
  piliers: Partial<Record<PilierKey, string>> // texte de chaque pilier
  exercices: Partial<Record<PilierKey, string[]>> // ids de public.exercices, dans l'ordre prévu
  notes: Partial<Record<NoteKey, string>> // notes privées (admin uniquement, table focus_seance_notes)
}

/** Une note privée par pilier, plus une note générale pour toute la séance. */
export type NoteKey = PilierKey | 'general'

export const FOCUS_SEANCE_COLUMNS = 'id, date, theme, ordre, publiee, focus_seance_piliers (pilier, contenu, exercices)'
/** Colonnes de l'admin : ajoute les notes privées. Ne jamais utiliser côté élève (la RLS les refuserait de toute façon). */
export const FOCUS_SEANCE_ADMIN_COLUMNS = `${FOCUS_SEANCE_COLUMNS}, focus_seance_notes (pilier, notes)`

interface FocusSeanceRow {
  id: string
  date: string
  theme: string
  ordre: number
  publiee: boolean
  focus_seance_piliers: { pilier: PilierKey; contenu: string; exercices: string[] | null }[] | null
  focus_seance_notes?: { pilier: NoteKey; notes: string }[] | null
}

export function toFocusSeance(row: FocusSeanceRow): FocusSeance {
  const piliers: FocusSeance['piliers'] = {}
  const exercices: FocusSeance['exercices'] = {}
  const notes: FocusSeance['notes'] = {}
  for (const n of row.focus_seance_notes ?? []) notes[n.pilier] = n.notes
  for (const p of row.focus_seance_piliers ?? []) {
    piliers[p.pilier] = p.contenu
    exercices[p.pilier] = p.exercices ?? []
  }
  return { id: row.id, date: row.date, theme: row.theme, ordre: row.ordre, publiee: row.publiee, piliers, exercices, notes }
}

/** Couleurs de la marque, une par pilier. */
export const PILIER_COLORS: Record<PilierKey, string> = {
  fondations: '#4db8c8',
  posture: '#c46bb5',
  collectif: '#e8789c',
  autonome: '#8b6fd1',
  scene: '#cf3594',
}

/* ── Dates des séances (texte libre → AAAA-MM-JJ) ── */

export function isoDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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
export function parseFrenchDate(text: string): string | null {
  const mot = text.toLowerCase().match(/(\d{1,2})(?:er)?\s+([a-zéû]+)(?:\s+(\d{4}))?/)
  const idx = mot ? MOIS.findIndex(x => x.startsWith(mot[2].slice(0, 4))) : -1
  if (!mot || idx < 0) return null
  return isoDate(mot[3] ? +mot[3] : anneeFormation(idx + 1), idx + 1, +mot[1])
}

/* ── Écarts entre le calendrier de la formation (lib/formation-focus.ts) et les séances enregistrées ── */

/** Une séance a du contenu si au moins un pilier a un texte ou des exercices. */
export function seanceRemplie(s: FocusSeance) {
  return PILIERS.some(p => !!s.piliers[p.key]?.trim() || !!s.exercices[p.key]?.length)
}

export type StatutSeance = 'prete' | 'vide' | 'manquante'

/** Une date prévue au calendrier (mercredi ou week-end), et la séance enregistrée qui lui correspond. */
export interface SeancePrevue {
  session: FocusSession
  seance: FocusSeance | null
  statut: StatutSeance // prete : séance avec contenu ; vide : séance sans contenu ; manquante : pas de séance
}

export interface EcartsCalendrier {
  prevues: SeancePrevue[] // tout le calendrier, dans l'ordre
  aCompleter: SeancePrevue[] // vides ou manquantes, passées ou dans les AVANCE_JOURS prochains jours
  horsCalendrier: FocusSeance[] // date reconnue mais absente du calendrier
  sansDate: FocusSeance[] // date vide ou illisible
}

/** Horizon des alertes : on prévient pour les séances passées et celles des 2 prochaines semaines. */
export const AVANCE_JOURS = 14

/** Les soirées de pratique publique n'ont pas de séance à préparer. */
const TYPES_A_PREPARER: FocusSession['type'][] = ['mercredi', 'weekend']

export function ecartsCalendrier(seances: FocusSeance[], today: string): EcartsCalendrier {
  const dates = new Map(seances.map(s => [s.id, seanceDates(s)]))
  const limite = new Date(Date.parse(today) + AVANCE_JOURS * 86_400_000).toISOString().slice(0, 10)
  const prevues: SeancePrevue[] = getSessions()
    .filter(session => TYPES_A_PREPARER.includes(session.type))
    .map(session => {
      const seance = seances.find(s => dates.get(s.id)!.some(d => session.dates.includes(d))) ?? null
      return { session, seance, statut: !seance ? 'manquante' : seanceRemplie(seance) ? 'prete' : 'vide' }
    })
  const joursPrevus = new Set(prevues.flatMap(p => p.session.dates)) // mercredis et week-ends seulement
  return {
    prevues,
    aCompleter: prevues.filter(p => p.statut !== 'prete' && p.session.dates[0] <= limite),
    horsCalendrier: seances.filter(s => { const d = dates.get(s.id)!; return d.length > 0 && !d.some(x => joursPrevus.has(x)) }),
    sansDate: seances.filter(s => dates.get(s.id)!.length === 0),
  }
}

/** Date à pré-remplir pour créer la séance d'une date du calendrier : « 21/10 » ou « 24-25/10 ». */
export function dateSaisie(session: FocusSession) {
  const [, m, d] = session.dates[0].split('-')
  const fin = session.dates.length > 1 ? `-${session.dates[session.dates.length - 1].slice(8)}` : ''
  return `${d}${fin}/${m}`
}
