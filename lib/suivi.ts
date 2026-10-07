import { STUDENT_TAGS, type StudentTagKey } from '@/lib/student-tags'

// Table public.suivi_seances (voir supabase/migrations/20261007_suivi_seances.sql).
// L'accès en lecture est filtré par la RLS selon les étiquettes ; seuls les admins écrivent.

export const SUIVI_CONTEXTES = ['focus2026-2027', 'ateliers', 'cours'] as const satisfies readonly StudentTagKey[]
export type SuiviContexte = typeof SUIVI_CONTEXTES[number]

export interface SuiviSeance {
  id: string
  date: string // 'YYYY-MM-DD'
  contexte: SuiviContexte
  recap: string | null
  exercices: string[] // ids de public.exercices, dans l'ordre de passage
  etiquettes: StudentTagKey[]
}

export interface Exercice {
  id: string
  titre: string
  description: string | null // description de l'exercice
  notions_objectifs: string | null
}

export const EXERCICE_COLUMNS = 'id, titre, description, notions_objectifs'

export function tagInfo(key: string) {
  return STUDENT_TAGS.find(t => t.key === key) ?? { key, label: key, color: '#888888' }
}
