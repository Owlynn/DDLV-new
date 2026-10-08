import type { SuiviContexte } from '@/lib/suivi'
import { todayKey } from '@/lib/formation-focus'

// Table public.paiements (voir supabase/migrations/20261008_paiements.sql) : une ligne par échéance.
// Les admins gèrent tout ; un élève lit uniquement ses paiements (RLS).
// user_id est null si le compte a été supprimé : eleve_nom garde alors la trace de l'élève.

export interface Paiement {
  id: string
  user_id: string | null
  eleve_nom: string | null
  date: string // 'YYYY-MM-DD'
  libelle: string
  contexte: SuiviContexte | null
  montant_du: number
  montant_paye: number
  echeance: string | null // 'YYYY-MM-DD'
  moyen_paiement: string | null
  commentaire: string | null
}

export const PAIEMENT_COLUMNS =
  'id, user_id, eleve_nom, date, libelle, contexte, montant_du, montant_paye, echeance, moyen_paiement, commentaire'

export const MOYENS_PAIEMENT = ['Virement', 'Chèque', 'Espèces', 'CB'] as const

export type StatutPaiement = 'paye' | 'partiel' | 'en_attente' | 'en_retard'

/** Statut calculé (non stocké) à partir des montants et de l'échéance. */
export function statutPaiement(p: Paiement, today = todayKey()): StatutPaiement {
  const du = Number(p.montant_du)
  const paye = Number(p.montant_paye)
  if (paye >= du) return 'paye'
  if (p.echeance && p.echeance < today) return 'en_retard'
  return paye > 0 ? 'partiel' : 'en_attente'
}

export const STATUT_LABELS: Record<StatutPaiement, string> = {
  paye: 'Payé',
  partiel: 'Partiel',
  en_attente: 'En attente',
  en_retard: 'En retard',
}

export function formatEuros(montant: number) {
  return Number(montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
