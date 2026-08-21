import type { Metadata } from 'next'
import { Bell } from 'lucide-react'
import SocialBar from '@/components/SocialBar'

const title = 'Newsletter – Restez informé.e des ateliers et événements'
const description = 'Abonnez-vous à la newsletter de Donner de la Voix pour recevoir les prochains stages et ateliers d\'improvisation vocale et circlesongs à Toulouse.'
const url = 'https://donnerdelavoix.fr/newsletter'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url },
  twitter: { title, description },
}

export default function NewsletterPage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative min-h-screen flex items-center pt-24 pb-12" aria-label="Newsletter">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Newsletter</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed">
              Restez informé.e des prochains stages &amp; ateliers, événements et actualités de Donner de la Voix. Abonnez-vous pour ne rien manquer&nbsp;!
            </p>
            <p className="text-white/70 text-sm md:text-base font-light">
              Pour des raisons de sécurité, nous vous demanderons de confirmer votre adresse email après votre inscription.
            </p>
          </div>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <div className="glass-panel-rose rounded-2xl p-6 md:p-8 w-full">
              <form
                action="https://donnerdelavoix.us19.list-manage.com/subscribe/post?u=98a48e5d0af7d8386462b6124&id=f6cad0bc4a&f_id=00c961e7f0"
                method="post"
                id="mc-embedded-subscribe-form"
                name="mc-embedded-subscribe-form"
                className="flex flex-col gap-4"
                target="_blank"
                aria-label="Formulaire d'inscription à la newsletter"
              >
                <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
                  <input type="text" name="b_98a48e5d0af7d8386462b6124_f6cad0bc4a" tabIndex={-1} defaultValue="" />
                </div>
                <div>
                  <label htmlFor="mce-EMAIL" className="sr-only">Adresse email</label>
                  <input
                    type="email"
                    name="EMAIL"
                    id="mce-EMAIL"
                    required
                    aria-required="true"
                    placeholder="Votre adresse email *"
                    className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  name="subscribe"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white bg-accent hover:bg-accent/90 border-0 cursor-pointer transition-all mt-2"
                  style={{ boxShadow: '0 4px 14px rgba(207,53,148,0.4)' }}
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  S&apos;abonner
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
