import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireUser } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const caller = await requireUser(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${randomUUID()}.${ext}`
  const admin = getSupabaseAdmin()
  const { error: uploadErr } = await admin.storage.from('blog-covers').upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data } = admin.storage.from('blog-covers').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
