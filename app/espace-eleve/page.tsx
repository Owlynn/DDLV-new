'use client'

import type { Metadata } from 'next'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import SocialBar from '@/components/SocialBar'
import { LogIn, Send } from 'lucide-react'

export default function EspaceElevePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/admin')
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  function switchMode(next: 'login' | 'forgot') {
    setMode(next)
    setError('')
    setResetSent(false)
  }

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section
        className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-24"
        aria-label="Espace élève"
      >
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-[2.8rem] sm:text-[3.6rem] md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Espace élève</span>
            </h1>
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed">
              Retrouvez votre suivi de cours et du matériel pédagogique.
            </p>
          </div>

          <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-md">
            {mode === 'login' ? (
              <form
                onSubmit={handleSubmit}
                className="glass-panel-rose bento-tint-primary rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
                aria-label="Connexion à l'espace élève"
              >
                <div>
                  <label htmlFor="login-email" className="sr-only">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Email *"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="sr-only">Mot de passe</label>
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Mot de passe *"
                    autoComplete="current-password"
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
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors text-center underline underline-offset-2"
                >
                  Mot de passe oublié ?
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleForgotSubmit}
                className="glass-panel-rose bento-tint-primary rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
                aria-label="Réinitialiser le mot de passe"
              >
                {resetSent ? (
                  <p className="text-sm text-center text-white/80 py-2">
                    Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-white/70 -mt-1">
                      Saisissez votre email, vous recevrez un lien pour définir un nouveau mot de passe.
                    </p>
                    <div>
                      <label htmlFor="forgot-email" className="sr-only">Email</label>
                      <input
                        type="email"
                        id="forgot-email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="Email *"
                        autoComplete="email"
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
                      <Send className="w-4 h-4" aria-hidden="true" />
                      {loading ? 'Envoi…' : 'Envoyer le lien'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors text-center underline underline-offset-2"
                >
                  Retour à la connexion
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
