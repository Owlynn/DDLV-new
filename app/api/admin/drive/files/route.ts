import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase-admin'
import { driveConfigured, listFolder } from '@/lib/google-drive'

// /admin → Formation Focus → Fichiers du Drive : les fichiers du Drive Focus (lus par le script Google Apps Script
// scripts/drive-focus.gs), à attribuer à un élève et à un devoir.
export async function GET(req: Request) {
  const caller = await requireAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  if (!driveConfigured()) {
    return NextResponse.json({ error: 'Le Drive n’est pas encore connecté.', code: 'non_configure' }, { status: 503 })
  }
  try {
    return NextResponse.json({ files: await listFolder() })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur inconnue' }, { status: 502 })
  }
}
