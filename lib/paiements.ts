// Tables public.paiements_eleves et public.versements (voir supabase/migrations/20261008_paiements_par_eleve.sql) :
// une ligne par élève avec le montant total dû, et les versements qui viennent s'y soustraire.
// Les admins gèrent tout ; un élève lit uniquement sa ligne et ses versements (RLS).
// user_id est null si le compte a été supprimé : eleve_nom garde alors la trace de l'élève.

export interface Versement {
  id: string
  paiement_eleve_id: string
  date: string // 'YYYY-MM-DD'
  montant: number
  moyen_paiement: string | null
  commentaire: string | null
}

export interface PaiementEleve {
  id: string
  user_id: string | null
  eleve_nom: string | null
  montant_du: number
  commentaire: string | null
  versements: Versement[] // triés par date
}

export const VERSEMENT_COLUMNS = 'id, paiement_eleve_id, date, montant, moyen_paiement, commentaire'
export const PAIEMENT_ELEVE_COLUMNS = `id, user_id, eleve_nom, montant_du, commentaire, versements (${VERSEMENT_COLUMNS})`

export const MOYENS_PAIEMENT = ['Virement', 'Chèque', 'Espèces', 'CB'] as const

export type StatutPaiement = 'solde' | 'partiel' | 'rien_paye'

export const STATUT_LABELS: Record<StatutPaiement, string> = {
  solde: 'Soldé',
  partiel: 'Partiel',
  rien_paye: 'Rien payé',
}

export function totalPaye(p: PaiementEleve) {
  return arrondi(p.versements.reduce((s, v) => s + Number(v.montant), 0))
}

export function resteAPayer(p: PaiementEleve) {
  return Math.max(arrondi(Number(p.montant_du) - totalPaye(p)), 0)
}

/** Statut calculé (non stocké) à partir du montant dû et des versements. */
export function statutPaiement(p: PaiementEleve): StatutPaiement {
  const paye = totalPaye(p)
  if (paye >= Number(p.montant_du)) return 'solde'
  return paye > 0 ? 'partiel' : 'rien_paye'
}

export function formatEuros(montant: number) {
  return Number(montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

/** Montant saisi en texte (« 12,50 », « 1 200 ») → nombre, NaN si invalide. */
export function parseMontant(s: string) {
  const clean = s.replace(/[\s €]/g, '').replace(',', '.')
  return clean ? Number(clean) : NaN
}

/** Arrondi au centime (évite les 66,670000000002 des additions de décimaux). */
function arrondi(n: number) {
  return Math.round(n * 100) / 100
}
