// Co-suivi Formation Focus (tables devoirs_enregistrements et devoirs_commentaires,
// voir supabase/migrations/20261116_co_suivi_focus.sql) : les enregistrements des devoirs, attribués depuis le Drive
// par un admin, que le groupe Focus écoute et commente.

import { supabase } from '@/lib/supabase-client'
import { FOCUS_TAG, formatDay } from '@/lib/formation-focus'
import { DEVOIR_COLUMNS, type Devoir } from '@/lib/devoirs'
import { EXERCICE_COLUMNS, type Exercice } from '@/lib/suivi'

export interface Enregistrement {
  id: string
  devoir_id: string
  user_id: string
  drive_file_id: string
  nom: string
  mime_type: string | null
  created_at: string
}

export interface Commentaire {
  id: string
  enregistrement_id: string
  auteur_id: string
  contenu: string
  public: boolean
  created_at: string
}

/** Nom affiché (prénom + initiale) d'un élève Focus ou d'un admin. */
export interface MembreFocus { user_id: string; nom: string; admin: boolean }

export const ENREGISTREMENT_COLUMNS = 'id, devoir_id, user_id, drive_file_id, nom, mime_type, created_at'
export const COMMENTAIRE_COLUMNS = 'id, enregistrement_id, auteur_id, contenu, public, created_at'

export interface DonneesCoSuivi {
  devoirs: Devoir[]
  exercices: Map<string, Exercice>
  enregistrements: Enregistrement[]
  commentaires: Commentaire[]
  membres: Map<string, MembreFocus>
}

/** Tout le co-suivi en une fois ; la RLS ne renvoie à chacun que ce qu'il peut voir. */
export async function chargerCoSuivi(): Promise<DonneesCoSuivi> {
  const [d, e, c, m] = await Promise.all([
    supabase.from('devoirs').select(DEVOIR_COLUMNS).eq('contexte', FOCUS_TAG).order('date_limite'),
    supabase.from('devoirs_enregistrements').select(ENREGISTREMENT_COLUMNS).order('created_at'),
    supabase.from('devoirs_commentaires').select(COMMENTAIRE_COLUMNS).order('created_at'),
    supabase.rpc('focus_noms'),
  ])
  const err = d.error ?? e.error ?? c.error ?? m.error
  if (err) throw new Error(err.message)
  const devoirs = (d.data ?? []) as Devoir[]
  const ids = [...new Set(devoirs.map(x => x.exercice_id).filter((x): x is string => !!x))]
  const ex = ids.length ? await supabase.from('exercices').select(EXERCICE_COLUMNS).in('id', ids) : { data: [] }
  return {
    devoirs,
    exercices: new Map(((ex.data ?? []) as Exercice[]).map(x => [x.id, x])),
    enregistrements: (e.data ?? []) as Enregistrement[],
    commentaires: (c.data ?? []) as Commentaire[],
    membres: new Map(((m.data ?? []) as MembreFocus[]).map(x => [x.user_id, x])),
  }
}

/** « 13/11/26 » */
export const dateCourte = (key: string) => formatDay(key, { day: '2-digit', month: '2-digit', year: '2-digit' })

/** Titre d'un devoir : son exercice, sinon la première ligne du commentaire. */
export function titreDevoir(d: Devoir, exercices: Map<string, Exercice>) {
  return (d.exercice_id && exercices.get(d.exercice_id)?.titre)
    || d.commentaire?.split('\n').find(l => l.trim())?.trim()
    || 'Contenu à venir'
}

export async function enTeteAuth(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}

/** URL de lecture signée d'un enregistrement (valable quelques heures). */
export async function lienLecture(enregistrementId: string): Promise<string> {
  const res = await fetch(`/api/focus/enregistrements/${enregistrementId}/lien`, { headers: await enTeteAuth() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data.url as string
}
