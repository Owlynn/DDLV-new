import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import { BookOpen, Music, FileText, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Espace élève | Ressources & suivi | Donner de la Voix',
  description: 'Espace dédié aux élèves de Donner de la Voix. Ressources pédagogiques, exercices et informations pour vos cours de chant.',
  alternates: { canonical: 'https://donnerdelavoix.fr/espace-eleve' },
}

export default function EspaceElevePage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12" aria-label="Hero">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[4.6rem] lg:text-[5.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Espace</span>
              <span className="hero-gradient-word block">élève</span>
            </h1>
          </div>
          <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            Bienvenue dans votre espace dédié. Retrouvez ici les ressources pédagogiques, exercices et informations utiles pour progresser entre les cours.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-5xl mx-auto pb-24">
        <div className="bento-formats-zone bento-formats-zone--content">
          <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass">
            <div className="bento-icon-wrap"><BookOpen className="bento-icon" /></div>
            <h3>Ressources pédagogiques</h3>
            <p className="m-0 text-sm">Cet espace est en cours de construction. Bientôt, vous y trouverez des exercices vocaux, des enregistrements de référence et des notes de cours.</p>
          </div>
          <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
            <div className="bento-icon-wrap"><Music className="bento-icon" /></div>
            <h3>En attendant...</h3>
            <p className="m-0 text-sm">N&apos;hésitez pas à me contacter si vous avez besoin d&apos;un exercice spécifique ou d&apos;une ressource pour travailler entre les cours.</p>
            <Link href="/contact" className="btn-rdv mt-auto">Me contacter</Link>
          </div>
          <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
            <div className="bento-icon-wrap"><FileText className="bento-icon" /></div>
            <h3>Notes de cours</h3>
            <p className="mb-0 text-sm">À venir — un espace pour retrouver les points travaillés lors de vos séances.</p>
          </div>
          <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
            <div className="bento-icon-wrap"><MessageCircle className="bento-icon" /></div>
            <h3>Questions ?</h3>
            <p className="mb-0 text-sm">Une question sur votre progression ou votre prochain cours ?</p>
            <Link href="/contact" className="btn-rdv mt-auto text-xs">Écrire</Link>
          </div>
        </div>
      </div>

      <SocialBar />
    </main>
  )
}
