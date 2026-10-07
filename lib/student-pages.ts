import type { StudentTagKey } from '@/lib/student-tags'
import { FOCUS_TAG } from '@/lib/formation-focus'

// Pages de l'espace élève. Une page avec `tag` n'apparaît (et n'est accessible)
// qu'aux comptes portant cette étiquette. Ajouter une page ici l'ajoute au menu.
export interface StudentPage {
  href: string
  label: string
  icon: string // nom d'icône Material Symbols
  tag?: StudentTagKey
}

export const STUDENT_PAGES: StudentPage[] = [
  { href: '/eleve', label: 'Accueil', icon: 'home' },
  { href: '/eleve/formation-focus', label: 'Formation Focus', icon: 'graphic_eq', tag: FOCUS_TAG },
]

export function canAccess(page: StudentPage, tags: StudentTagKey[]) {
  return !page.tag || tags.includes(page.tag) || tags.includes('admin')
}
