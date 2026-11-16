import { after } from 'next/server'
import { TAILLE_MORCEAU, morceau, verifierLienMedia } from '@/lib/google-drive'

// Lecture d'un fichier du Drive Focus par le lecteur audio / vidéo du co-suivi.
// L'URL est signée par /api/focus/enregistrements/[id]/lien (droits vérifiés là).
// Le fichier est servi par blocs (réponses 206 de 4 Mo au plus, sous la limite de 4,5 Mo de Vercel) : le navigateur
// demande la suite tout seul, et l'avance rapide marche. Les morceaux suivants sont préchargés en cache pendant l'écoute.

// Un gros WAV peut demander une dizaine de secondes par morceau au script Google
export const maxDuration = 60

const MORCEAUX_PAR_REPONSE = 2 // 2 × 2 Mo
const MORCEAUX_PRECHARGES = 4  // ≈ 8 Mo d'avance

export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const url = new URL(req.url)
  if (!verifierLienMedia(fileId, url.searchParams.get('exp'), url.searchParams.get('sig'))) {
    return new Response('Lien expiré ou invalide', { status: 403 })
  }

  // « bytes=12345- » ou « bytes=12345-67890 » : on part de l'octet demandé
  const debut = Number(/^bytes=(\d+)-/.exec(req.headers.get('range') ?? '')?.[1] ?? 0)
  const premier = Math.floor(debut / TAILLE_MORCEAU)

  let morceaux
  try {
    const premierMorceau = await morceau(fileId, premier)
    const total = premierMorceau.total
    if (total > 0 && debut >= total) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } })
    }
    const dernierIndex = Math.max(0, Math.ceil(total / TAILLE_MORCEAU) - 1)
    // On n'attend que le premier morceau ; les suivants ne sont ajoutés que s'ils sont déjà en cache
    // (sinon le lecteur les demandera, préchargés entre-temps) : la lecture démarre au plus tôt.
    morceaux = [premierMorceau]
    for (let i = premier + 1; i < premier + MORCEAUX_PAR_REPONSE && i <= dernierIndex; i++) {
      const pret = await Promise.race([morceau(fileId, i).catch(() => null), new Promise<null>(r => setTimeout(() => r(null), 0))])
      if (!pret) break
      morceaux.push(pret)
    }

    // Après la réponse : précharge la suite pour la prochaine demande du lecteur
    after(async () => {
      const fin = Math.min(premier + MORCEAUX_PAR_REPONSE + MORCEAUX_PRECHARGES - 1, dernierIndex)
      const prechargement = []
      for (let i = premier + MORCEAUX_PAR_REPONSE; i <= fin; i++) prechargement.push(morceau(fileId, i).catch(() => null))
      await Promise.all(prechargement)
    })
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'Erreur Drive', { status: 502 })
  }

  const premierMorceau = morceaux[0]
  const donnees = Buffer.concat(morceaux.map(m => m.data)).subarray(debut - premierMorceau.start)
  const fin = debut + donnees.length - 1

  return new Response(new Uint8Array(donnees), {
    status: 206,
    headers: {
      'Content-Type': premierMorceau.mimeType || 'application/octet-stream',
      'Content-Length': String(donnees.length),
      'Content-Range': `bytes ${debut}-${fin}/${premierMorceau.total}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
