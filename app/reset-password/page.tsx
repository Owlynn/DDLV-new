'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import SocialBar from '@/components/SocialBar'
import { KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setInvalid(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/admin'), 1500)
  }

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section
        className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-24"
        aria-label="Réinitialisation du mot de passe"
      >
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-[2.8rem] sm:text-[3.6rem] md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Nouveau mot de passe</span>
            </h1>
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed">
              Choisissez un nouveau mot de passe pour votre espace élève.
            </p>
          </div>

          <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-md">
            <form
              onSubmit={handleSubmit}
              className="glass-panel-rose bento-tint-primary rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
              aria-label="Définir un nouveau mot de passe"
            >
              {invalid ? (
                <p className="text-sm text-center text-white/80 py-2">
                  Ce lien de réinitialisation est invalide ou a expiré. Merci de refaire une demande depuis la page{' '}
                  <a href="/espace-eleve" className="text-accent underline underline-offset-2">Espace élève</a>.
                </p>
              ) : done ? (
                <p className="text-sm text-center text-white/80 py-2">
                  Mot de passe mis à jour. Redirection…
                </p>
              ) : !ready ? (
                <p className="text-sm text-center text-white/60 py-2">Vérification du lien…</p>
              ) : (
                <>
                  <div>
                    <label htmlFor="new-password" className="sr-only">Nouveau mot de passe</label>
                    <input
                      type="password"
                      id="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Nouveau mot de passe *"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Confirmer le mot de passe *"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-center text-red-400">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white bg-accent hover:bg-accent/90 border-0 cursor-pointer transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 4px 14px rgba(207,53,148,0.4)' }}
                  >
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                    {loading ? 'Mise à jour…' : 'Valider le nouveau mot de passe'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
