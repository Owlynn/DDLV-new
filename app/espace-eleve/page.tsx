import type { Metadata } from 'next'
import SocialBar from '@/components/SocialBar'
import { LogIn } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Espace élève | Donner de la Voix',
  description: 'Connectez-vous à votre espace élève pour accéder à votre suivi de cours et au matériel pédagogique.',
  alternates: { canonical: 'https://donnerdelavoix.fr/espace-eleve' },
}

export default function EspaceElevePage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-24" aria-label="Espace élève">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-[2.8rem] sm:text-[3.6rem] md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Espace élève</span>
            </h1>
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed">
              Retrouvez votre suivi de cours et du matériel pédagogique.
            </p>
          </div>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <form
              className="glass-panel-rose bento-tint-primary rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
              aria-label="Formulaire de connexion"
            >
              <div>
                <label htmlFor="login-email" className="sr-only">Email</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
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
                  name="password"
                  required
                  placeholder="Mot de passe *"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white bg-accent hover:bg-accent/90 border-0 cursor-pointer transition-all mt-2"
                style={{ boxShadow: '0 4px 14px rgba(207,53,148,0.4)' }}
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
