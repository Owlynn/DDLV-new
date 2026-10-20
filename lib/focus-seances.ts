// Tables public.focus_seances et public.focus_seance_piliers (voir supabase/migrations/20261020_focus_seances.sql) :
// préparation des séances de la Formation Focus, outil interne réservé aux admins (RLS).

export type PilierKey = 'fondations' | 'posture' | 'collectif' | 'autonome' | 'scene'

/** Les 5 piliers, dans l'ordre d'affichage. */
export const PILIERS: { key: PilierKey; label: string; sousTitre?: string }[] = [
  { key: 'fondations', label: 'Les fondations techniques', sousTitre: '1h minimum à chaque séance' },
  { key: 'posture', label: "La posture intérieure de l'improvisatrice" },
  { key: 'collectif', label: 'La dimension collective' },
  { key: 'autonome', label: 'La pratique autonome' },
  { key: 'scene', label: "L'improvisation sur scène" },
]

export interface FocusSeance {
  id: string
  date: string
  theme: string
  ordre: number
  piliers: Partial<Record<PilierKey, string>> // texte de chaque pilier
  exercices: Partial<Record<PilierKey, string[]>> // ids de public.exercices, dans l'ordre prévu
}

export const FOCUS_SEANCE_COLUMNS = 'id, date, theme, ordre, focus_seance_piliers (pilier, contenu, exercices)'

interface FocusSeanceRow {
  id: string
  date: string
  theme: string
  ordre: number
  focus_seance_piliers: { pilier: PilierKey; contenu: string; exercices: string[] | null }[] | null
}

export function toFocusSeance(row: FocusSeanceRow): FocusSeance {
  const piliers: FocusSeance['piliers'] = {}
  const exercices: FocusSeance['exercices'] = {}
  for (const p of row.focus_seance_piliers ?? []) {
    piliers[p.pilier] = p.contenu
    exercices[p.pilier] = p.exercices ?? []
  }
  return { id: row.id, date: row.date, theme: row.theme, ordre: row.ordre, piliers, exercices }
}
