import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireAdmin } from '@/lib/supabase-admin'

// Renvoie un lien à un élève existant, sans recréer le compte :
// invitation si le compte n'a jamais été activé, sinon lien « définir un mot de passe »
// (Supabase refuse de réinviter une adresse déjà confirmée).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireAdmin(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.getUserById(id)
  if (error || !data.user?.email) return NextResponse.json({ error: error?.message ?? 'Élève introuvable' }, { status: 404 })

  const { email, email_confirmed_at } = data.user
  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://donnerdelavoix.fr'}/reset-password`
  const { error: sendError } = email_confirmed_at
    ? await admin.auth.resetPasswordForEmail(email, { redirectTo })
    : await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 400 })

  return NextResponse.json({ ok: true, kind: email_confirmed_at ? 'recovery' : 'invite' })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireAdmin(req)
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
