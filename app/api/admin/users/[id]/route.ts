import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireUser } from '@/lib/supabase-admin'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireUser(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (id === caller.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
