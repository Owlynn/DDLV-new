import { supabase } from '@/lib/supabase-client'
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
  notions_objectifs: string[] // ids de public.notions_objectifs
}

export const EXERCICE_COLUMNS = 'id, titre, description, notions_objectifs'

// Table public.notions_objectifs : liste réutilisable, choisie par recherche dans le formulaire d'exercice.
export interface Notion {
  id: string
  libelle: string
}

export const NOTION_COLUMNS = 'id, libelle'

/** Libellés des notions d'un exercice, dans l'ordre choisi (les ids inconnus sont ignorés). */
export function notionLabels(exercice: Exercice, notions: Map<string, Notion>) {
  return exercice.notions_objectifs.map(id => notions.get(id)?.libelle).filter((l): l is string => !!l)
}

export function tagInfo(key: string) {
  return STUDENT_TAGS.find(t => t.key === key) ?? { key, label: key, color: '#888888' }
}

export async function fetchNotions(): Promise<Notion[]> {
  const { data } = await supabase.from('notions_objectifs').select(NOTION_COLUMNS).order('libelle')
  return (data ?? []) as Notion[]
}

/** Crée une notion (admin). Renvoie la notion existante si le libellé existe déjà (sans tenir compte de la casse). */
export async function createNotion(libelle: string): Promise<{ notion: Notion | null; error?: string }> {
  const { data, error } = await supabase.from('notions_objectifs').insert({ libelle }).select(NOTION_COLUMNS).single()
  if (!error) return { notion: data as Notion }
  const { data: existing } = await supabase.from('notions_objectifs').select(NOTION_COLUMNS).ilike('libelle', libelle.replace(/[%_\\]/g, '\\$&')).maybeSingle()
  return existing ? { notion: existing as Notion } : { notion: null, error: error.message }
}
