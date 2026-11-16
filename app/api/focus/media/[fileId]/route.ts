import { fetchMedia, verifierLienMedia } from '@/lib/google-drive'

// Lecture d'un fichier du Drive Focus par le lecteur audio / vidéo du co-suivi.
// L'URL est signée par /api/focus/enregistrements/[id]/lien (droits vérifiés là) ; l'en-tête Range est transmis
// au Drive pour permettre l'avance rapide sans tout télécharger.
export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const url = new URL(req.url)
  if (!verifierLienMedia(fileId, url.searchParams.get('exp'), url.searchParams.get('sig'))) {
    return new Response('Lien expiré ou invalide', { status: 403 })
  }

  let res: Response
  try {
    res = await fetchMedia(fileId, req.headers.get('range'))
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'Erreur Drive', { status: 502 })
  }
  if (!res.ok && res.status !== 206) return new Response('Fichier indisponible sur le Drive', { status: res.status === 404 ? 404 : 502 })

  const headers = new Headers({ 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' })
  for (const h of ['content-type', 'content-length', 'content-range']) {
    const v = res.headers.get(h)
    if (v) headers.set(h, v)
  }
  return new Response(res.body, { status: res.status, headers })
}
