'use client'

import SuiviSeancesManager from '@/components/SuiviSeancesManager'
import { useStudent } from '@/components/eleve/StudentContext'
import type { SuiviContexte } from '@/lib/suivi'

/** Suivi des séances d'un bloc de l'espace élève ; les admins peuvent éditer sur place. */
export default function SuiviSeances({ contexte }: { contexte: SuiviContexte }) {
  const { tags } = useStudent()
  return <SuiviSeancesManager contexte={contexte} canEdit={tags.includes('admin')} />
}
