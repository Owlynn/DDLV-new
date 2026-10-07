import { supabase } from '@/lib/supabase-client'
import type { StudentTagKey } from '@/lib/student-tags'

/** Étiquettes du compte connecté (la RLS ne laisse un élève lire que sa propre ligne). */
export async function getMyTags(userId: string): Promise<StudentTagKey[]> {
  const { data } = await supabase.from('student_tags').select('tags').eq('user_id', userId).maybeSingle()
  return (data?.tags ?? []) as StudentTagKey[]
}

/** Page d'arrivée après connexion : /admin pour les admins, /eleve pour les autres. */
export async function homePathFor(userId: string) {
  const tags = await getMyTags(userId)
  return tags.includes('admin') ? '/admin' : '/eleve'
}
