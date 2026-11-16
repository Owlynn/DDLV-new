import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireUser } from '@/lib/supabase-admin'
import { lienMedia } from '@/lib/google-drive'
import { FOCUS_TAG } from '@/lib/formation-focus'

// Lien de lecture signé pour un enregistrement du co-suivi : réservé aux élèves Focus et aux admins.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: tags } = await admin.from('student_tags').select('tags').eq('user_id', user.id).maybeSingle()
  const t: string[] = tags?.tags ?? []
  if (!t.includes('admin') && !t.includes(FOCUS_TAG)) return NextResponse.json({ error: 'Réservé au groupe Formation Focus' }, { status: 403 })

  const { id } = await params
  const { data, error } = await admin.from('devoirs_enregistrements').select('drive_file_id').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Enregistrement introuvable' }, { status: 404 })

  return NextResponse.json({ url: lienMedia(data.drive_file_id) })
}
