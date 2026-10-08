import type { StudentTagKey } from '@/lib/student-tags'
import { FOCUS_TAG } from '@/lib/formation-focus'

// Pages de l'espace élève. Une page avec `tag` n'apparaît (et n'est accessible)
// qu'aux comptes portant cette étiquette. Ajouter une page ici l'ajoute au menu ;
// les `children` s'affichent en sous-menu et héritent du `tag` de leur parent.
// Un bloc sans `href` est un simple titre de section dans le menu.
export interface StudentPage {
  href?: string
  label: string
  icon: string // nom d'icône Material Symbols
  tag?: StudentTagKey
  children?: (StudentPage & { href: string })[]
}

export const STUDENT_PAGES: StudentPage[] = [
  { href: '/eleve', label: 'Accueil', icon: 'home' },
  { href: '/eleve/infos', label: 'Mes informations', icon: 'badge' },
  { href: '/eleve/paiements', label: 'Mes paiements', icon: 'payments' },
  {
    href: '/eleve/formation-focus', label: 'Formation Focus', icon: 'graphic_eq', tag: FOCUS_TAG,
    children: [
      { href: '/eleve/formation-focus/calendrier', label: 'Calendrier', icon: 'calendar_month' },
      { href: '/eleve/formation-focus/suivi', label: 'Suivi des séances', icon: 'history_edu' },
      { href: '/eleve/formation-focus/devoirs', label: 'Devoirs à rendre', icon: 'assignment' },
    ],
  },
  {
    label: 'Cours', icon: 'music_note', tag: 'cours',
    children: [
      { href: '/eleve/cours/suivi', label: 'Suivi des séances', icon: 'history_edu' },
    ],
  },
  {
    label: 'Ateliers', icon: 'groups', tag: 'ateliers',
    children: [
      { href: '/eleve/ateliers/suivi', label: 'Suivi des séances', icon: 'history_edu' },
    ],
  },
]

export function canAccess(page: StudentPage, tags: StudentTagKey[]) {
  return !page.tag || tags.includes(page.tag) || tags.includes('admin')
}

/** Retrouve la page (et son parent éventuel) correspondant à une URL. Un sous-menu hérite du tag du parent. */
export function findStudentPage(pathname: string): { page: StudentPage; parent?: StudentPage } | undefined {
  for (const page of STUDENT_PAGES) {
    if (page.href === pathname) return { page }
    const child = page.children?.find(c => c.href === pathname)
    if (child) return { page: { ...child, tag: child.tag ?? page.tag }, parent: page }
  }
}

/** Première page accessible d'un bloc (sa propre page, sinon son premier sous-menu). */
export function entryHref(page: StudentPage) {
  return page.href ?? page.children?.[0]?.href
}
