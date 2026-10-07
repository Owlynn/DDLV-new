import type { StudentTagKey } from '@/lib/student-tags'
import type { SuiviContexte } from '@/lib/suivi'

// Tables public.devoirs et public.devoirs_rendus (voir supabase/migrations/20261007_devoirs.sql).

export interface Devoir {
  id: string
  contexte: SuiviContexte
  date_limite: string // 'YYYY-MM-DD'
  exercice_id: string | null
  commentaire: string | null
  etiquettes: StudentTagKey[]
}

export const DEVOIR_COLUMNS = 'id, contexte, date_limite, exercice_id, commentaire, etiquettes'

export interface DevoirRendu {
  devoir_id: string
  user_id: string
  date_rendu: string // timestamptz ISO
}

/** Un devoir sans exercice ni commentaire n'a pas encore de contenu ("Contenu à venir"). */
export function hasContent(d: Devoir) {
  return !!d.exercice_id || !!d.commentaire?.trim()
}
