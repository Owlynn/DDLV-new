import { createHmac, createSign, timingSafeEqual } from 'crypto'

// Accès au Drive Focus par un compte de service Google (lecture seule), côté serveur uniquement :
// ne jamais importer depuis un fichier 'use client' (comme lib/supabase-admin.ts).
// Variable d'environnement GOOGLE_SERVICE_ACCOUNT_KEY : le contenu du fichier JSON de la clé du compte de service.
// Le dossier Drive doit être partagé (lecteur) avec l'adresse e-mail du compte de service.

interface ServiceAccountKey { client_email: string; private_key: string }

function serviceAccount(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY manquante dans les variables d'environnement.")
  const key = JSON.parse(raw) as ServiceAccountKey
  return { client_email: key.client_email, private_key: key.private_key.replace(/\\n/g, '\n') }
}

export function serviceAccountEmail(): string | null {
  try { return serviceAccount().client_email } catch { return null }
}

let cached: { token: string; exp: number } | null = null

/** Jeton d'accès Google (OAuth 2, flux « JWT bearer » du compte de service), mis en cache jusqu'à expiration. */
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token
  const { client_email, private_key } = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(private_key).toString('base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Connexion à Google impossible : ${data.error_description ?? data.error ?? res.status}`)
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 }
  return cached.token
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
  dossier: string // chemin des sous-dossiers depuis le dossier Focus ('' à la racine)
}

const FOLDER = 'application/vnd.google-apps.folder'

/** Tous les fichiers du dossier et de ses sous-dossiers (3 niveaux au plus), du plus récent au plus ancien. */
export async function listFolder(folderId: string): Promise<DriveFile[]> {
  const token = await accessToken()
  const files: DriveFile[] = []

  async function parcourir(id: string, chemin: string, profondeur: number) {
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams({
        q: `'${id}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
        pageSize: '1000',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(`Lecture du Drive impossible : ${data.error?.message ?? res.status}`)
      for (const f of data.files as Omit<DriveFile, 'dossier'>[]) {
        if (f.mimeType === FOLDER) {
          if (profondeur < 3) await parcourir(f.id, chemin ? `${chemin} / ${f.name}` : f.name, profondeur + 1)
        } else {
          files.push({ ...f, dossier: chemin })
        }
      }
      pageToken = data.nextPageToken
    } while (pageToken)
  }

  await parcourir(folderId, '', 0)
  return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
}

/** Contenu d'un fichier, en transmettant l'en-tête Range (lecture audio / vidéo avec avance rapide). */
export async function fetchMedia(fileId: string, range: string | null): Promise<Response> {
  const token = await accessToken()
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (range) headers.Range = range
  return fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, { headers, cache: 'no-store' })
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
