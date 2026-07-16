import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireUser } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const caller = await requireUser(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = data.users
    .map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed_at: u.confirmed_at ?? u.email_confirmed_at ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ users })
}

export async function POST(req: Request) {
  const caller = await requireUser(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data.user })
}
