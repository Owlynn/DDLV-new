import { supabase } from '@/lib/supabase-client'

// Table public.eleves (voir supabase/migrations/20261007_eleves.sql) : une fiche par compte.
// L'élève modifie prénom/nom/téléphone ; le groupe n'est modifiable que par un admin (trigger en base).

export interface FicheEleve {
  user_id: string
  prenom: string | null
  nom: string | null
  telephone: string | null
  groupe: string | null
}

export const ELEVE_COLUMNS = 'user_id, prenom, nom, telephone, groupe'

/** « Prénom Nom », ou à défaut l'email. */
export function displayName(fiche: FicheEleve | undefined, email?: string | null) {
  const name = [fiche?.prenom, fiche?.nom].map(s => s?.trim()).filter(Boolean).join(' ')
  return name || email || 'Élève'
}

/** Fiches indexées par user_id (un admin les voit toutes ; un élève seulement la sienne). */
export async function fetchFiches(): Promise<Map<string, FicheEleve>> {
  const { data } = await supabase.from('eleves').select(ELEVE_COLUMNS)
  return new Map(((data ?? []) as FicheEleve[]).map(f => [f.user_id, f]))
}

/** Crée ou met à jour une fiche. Pour un élève, le groupe envoyé est ignoré par la base. */
export async function saveFiche(fiche: FicheEleve) {
  const clean = (s: string | null) => s?.trim() || null
  return supabase.from('eleves').upsert({
    user_id: fiche.user_id,
    prenom: clean(fiche.prenom),
    nom: clean(fiche.nom),
    telephone: clean(fiche.telephone),
    groupe: clean(fiche.groupe),
  })
}
