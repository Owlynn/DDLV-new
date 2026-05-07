'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SocialBar from '@/components/SocialBar'
import { Send, Bell } from 'lucide-react'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  const startTimeRef = useRef<number>(Date.now())

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    const honeypot = formRef.current.querySelector<HTMLInputElement>('[name="website"]')
    if (honeypot?.value) return

    const elapsed = Date.now() - startTimeRef.current
    if (elapsed < 3000) {
      alert('Veuillez prendre le temps de remplir le formulaire correctement.')
      return
    }

    const message = formRef.current.querySelector<HTMLTextAreaElement>('[name="message"]')?.value.trim()
    if (!message || message.length < 10) {
      alert('Le message doit contenir au moins 10 caractères.')
      return
    }

    setStatus('sending')

    const w = window as any
    if (!w.EMAILJS_CONFIG || !w.emailjs) {
      setStatus('error')
      alert('Le formulaire n\'est pas encore configuré pour l\'envoi d\'emails.')
      setStatus('idle')
      return
    }

    try {
      await w.emailjs.sendForm(w.EMAILJS_CONFIG.SERVICE_ID, w.EMAILJS_CONFIG.TEMPLATE_ID, formRef.current)
      setStatus('sent')
      formRef.current.reset()
      startTimeRef.current = Date.now()
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      alert('Erreur lors de l\'envoi. Veuillez réessayer.')
      setStatus('idle')
    }
  }

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-24" aria-label="Contact" id="contact">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Contact</span>
            </h1>
            <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed">
              Vous avez des questions sur les cours de chant, les stages & ateliers d&apos;improvisation vocale ou les circle songs ? N&apos;hésitez pas à me contacter.
            </p>
            <p className="text-white/80 text-sm md:text-base font-light">
              Vous préférez recevoir les actualités par email ?{' '}
              <a href="#newsletter" className="text-white underline underline-offset-2 hover:text-accent transition-colors">S&apos;abonner à la newsletter</a>.
            </p>
          </div>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="glass-panel-rose bento-tint-primary rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
              aria-label="Formulaire de contact"
              noValidate
            >
              <input type="text" name="website" className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="sr-only">Nom</label>
                  <input type="text" id="contact-name" name="name" required placeholder="Nom *" minLength={2} maxLength={100}
                    className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">Email</label>
                  <input type="email" id="contact-email" name="email" required placeholder="Email *" maxLength={254}
                    className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject" className="sr-only">Sujet</label>
                <input type="text" id="contact-subject" name="subject" placeholder="Sujet" maxLength={200}
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all" />
              </div>
              <div>
                <label htmlFor="contact-message" className="sr-only">Message</label>
                <textarea id="contact-message" name="message" rows={5} required placeholder="Message *" minLength={10} maxLength={3000}
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all resize-vertical min-h-[120px]" />
              </div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white bg-accent hover:bg-accent/90 border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ boxShadow: '0 4px 14px rgba(207,53,148,0.4)' }}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {status === 'sending' ? 'Envoi en cours...' : status === 'sent' ? 'Message envoyé !' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="hero-overlay relative flex items-center py-12 md:py-24 scroll-mt-24" aria-label="Newsletter" id="newsletter">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-10 lg:gap-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h2 className="text-[2.5rem] sm:text-[3rem] md:text-[4rem] lg:text-[5rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word">Newsletter</span>
            </h2>
            <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed">
              Restez informé.e des prochains stages & ateliers, événements et actualités de Donner de la Voix.
            </p>
            <p className="text-white/70 text-sm md:text-base font-light">
              Pour des raisons de sécurité, nous vous demanderons de confirmer votre adresse email après votre inscription.
            </p>
          </div>
          <div className="w-full lg:flex-1 lg:min-w-0">
            <form
              className="glass-panel-rose bento-tint-accent rounded-2xl p-6 md:p-8 flex flex-col gap-4 w-full relative overflow-hidden"
              action="https://donnerdelavoix.us19.list-manage.com/subscribe/post?u=98a48e5d0af7d8386462b6124&id=f6cad0bc4a&f_id=00c961e7f0"
              method="post"
              target="_blank"
              aria-label="Inscription à la newsletter"
              noValidate
            >
              <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
                <input type="text" name="b_98a48e5d0af7d8386462b6124_f6cad0bc4a" tabIndex={-1} defaultValue="" />
              </div>
              <div>
                <label htmlFor="mce-EMAIL-contact" className="sr-only">Adresse email</label>
                <input type="email" name="EMAIL" id="mce-EMAIL-contact" required placeholder="Votre adresse email *"
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-accent focus:bg-white/15 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all" />
              </div>
              <button
                type="submit"
                name="subscribe"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white bg-accent hover:bg-accent/90 border-0 cursor-pointer transition-all"
                style={{ boxShadow: '0 4px 14px rgba(207,53,148,0.4)' }}
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                S&apos;abonner
              </button>
            </form>
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
