import { createHmac, timingSafeEqual } from 'crypto'

// Accès au Drive Focus, côté serveur uniquement : ne jamais importer depuis un fichier 'use client'
// (comme lib/supabase-admin.ts). Le Drive est lu par un script Google Apps Script exécuté avec le compte Google
// de la formatrice (scripts/drive-focus.gs, gratuit, sans console Google Cloud) :
// - GOOGLE_APPS_SCRIPT_URL : l'URL de déploiement de l'application web (…/exec)
// - GOOGLE_APPS_SCRIPT_TOKEN : le jeton secret, identique à la constante JETON du script

function config() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL
  const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN
  return url && token ? { url, token } : null
}

export function driveConfigured() {
  return !!config()
}

async function appelScript<T>(params: Record<string, string>): Promise<T> {
  const c = config()
  if (!c) throw new Error('Le Drive n’est pas connecté (GOOGLE_APPS_SCRIPT_URL / GOOGLE_APPS_SCRIPT_TOKEN manquants).')
  // Le jeton est envoyé de serveur à serveur uniquement, jamais au navigateur
  const res = await fetch(`${c.url}?${new URLSearchParams({ ...params, token: c.token })}`, { cache: 'no-store', redirect: 'follow' })
  const texte = await res.text()
  let data: T & { error?: string }
  try { data = JSON.parse(texte) } catch { throw new Error(`Réponse inattendue du script Google (HTTP ${res.status}) : vérifiez l’URL et l’accès « Tout le monde ».`) }
  if (data.error) throw new Error(`Script Google : ${data.error}`)
  return data
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
  dossier: string // chemin des sous-dossiers depuis le dossier Focus ('' à la racine)
}

/** Tous les fichiers du dossier Focus et de ses sous-dossiers, du plus récent au plus ancien. */
export async function listFolder(): Promise<DriveFile[]> {
  const { files } = await appelScript<{ files: DriveFile[] }>({ action: 'list' })
  return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
}

export interface MorceauMedia { mimeType: string; total: number; start: number; end: number; data: Buffer }

/** Taille d'un morceau : la même que TAILLE_MORCEAU dans scripts/drive-focus.gs. */
export const TAILLE_MORCEAU = 2 * 1024 * 1024

/** Un morceau d'un fichier (2 Mo au plus) à partir de l'octet `start`. */
export async function fetchMorceau(fileId: string, start: number): Promise<MorceauMedia> {
  const m = await appelScript<{ mimeType: string; total: number; start: number; end: number; data: string }>({ action: 'file', id: fileId, start: String(start) })
  return { ...m, data: Buffer.from(m.data, 'base64') }
}

/* ── Cache des morceaux ──
   Le script recharge tout le fichier à chaque appel (≈ 10 s pour un WAV de 30 Mo) : on garde en mémoire les
   morceaux déjà lus (alignés sur TAILLE_MORCEAU), et la route de lecture précharge les suivants pendant l'écoute.
   Cache par instance serveur, limité en taille et en durée. */

const CACHE_MAX_OCTETS = 300 * 1024 * 1024
const CACHE_DUREE_MS = 30 * 60_000
const cache = new Map<string, { promesse: Promise<MorceauMedia>; octets: number; vu: number }>()

function nettoyerCache() {
  const maintenant = Date.now()
  for (const [k, v] of cache) if (maintenant - v.vu > CACHE_DUREE_MS) cache.delete(k)
  let total = [...cache.values()].reduce((s, v) => s + v.octets, 0)
  for (const [k, v] of [...cache.entries()].sort((a, b) => a[1].vu - b[1].vu)) {
    if (total <= CACHE_MAX_OCTETS) break
    cache.delete(k)
    total -= v.octets
  }
}

/** Le morceau n° `index` du fichier (octets index × 2 Mo …), depuis le cache ou le script. */
export function morceau(fileId: string, index: number): Promise<MorceauMedia> {
  const cle = `${fileId}:${index}`
  const existant = cache.get(cle)
  if (existant) { existant.vu = Date.now(); return existant.promesse }
  const promesse = fetchMorceau(fileId, index * TAILLE_MORCEAU)
  const entree = { promesse, octets: TAILLE_MORCEAU, vu: Date.now() }
  cache.set(cle, entree)
  promesse.then(m => { entree.octets = m.data.length; nettoyerCache() }, () => cache.delete(cle)) // un échec n'est pas gardé
  return promesse
}

/* ── Liens de lecture signés ──
   Un lecteur <audio> ne peut pas envoyer d'en-tête Authorization : après vérification des droits,
   le serveur donne une URL signée (HMAC), valable quelques heures, pour un fichier donné. */

const DUREE_LIEN_MS = 6 * 3600_000

function secret() {
  const s = process.env.MEDIA_SIGNING_SECRET ?? process.env.SUPABASE_SECRET_KEY
  if (!s) throw new Error('Aucun secret de signature (MEDIA_SIGNING_SECRET ou SUPABASE_SECRET_KEY).')
  return s
}

const signer = (fileId: string, exp: number) => createHmac('sha256', secret()).update(`focus-media:${fileId}:${exp}`).digest('base64url')

export function lienMedia(fileId: string) {
  const exp = Date.now() + DUREE_LIEN_MS
  return `/api/focus/media/${encodeURIComponent(fileId)}?exp=${exp}&sig=${signer(fileId, exp)}`
}

export function verifierLienMedia(fileId: string, exp: string | null, sig: string | null) {
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  const attendu = Buffer.from(signer(fileId, Number(exp)))
  const recu = Buffer.from(sig)
  return attendu.length === recu.length && timingSafeEqual(attendu, recu)
}
