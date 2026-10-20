// Tables public.focus_seances et public.focus_seance_piliers (voir supabase/migrations/20261020_focus_seances.sql) :
// préparation des séances de la Formation Focus. Les admins gèrent tout ; les élèves Focus lisent les séances publiées (RLS).

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
  notes: Partial<Record<PilierKey, string>> // notes privées (admin uniquement, table focus_seance_notes)
}

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
  focus_seance_notes?: { pilier: PilierKey; notes: string }[] | null
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
