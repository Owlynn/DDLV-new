import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase-admin'
import { listFolder, serviceAccountEmail } from '@/lib/google-drive'
import { FOCUS_DRIVE_FOLDER_ID } from '@/lib/formation-focus'

// /admin → Formation Focus → Co-suivi : les fichiers du Drive Focus, à attribuer à un élève et à un devoir.
export async function GET(req: Request) {
  const caller = await requireAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const email = serviceAccountEmail()
  if (!email) {
    return NextResponse.json({ error: 'Le Drive n’est pas encore connecté : variable GOOGLE_SERVICE_ACCOUNT_KEY manquante.', code: 'non_configure' }, { status: 503 })
  }
  try {
    const files = await listFolder(FOCUS_DRIVE_FOLDER_ID)
    return NextResponse.json({ files, serviceAccount: email })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur inconnue', serviceAccount: email }, { status: 502 })
  }
}
