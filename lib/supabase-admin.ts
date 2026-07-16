import { createClient, type User } from '@supabase/supabase-js'

const supabaseUrl = 'https://kkospetzeglprzxasecw.supabase.co'

export function getSupabaseAdmin() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY manquante dans les variables d'environnement.")
  }
  return createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function requireUser(req: Request): Promise<User | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
