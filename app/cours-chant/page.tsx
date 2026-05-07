'use client'

import { useState } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import { Users, Mic, Briefcase, Music, Sparkles, Heart, Award, Target, Layers, Music2, Volume2, Wind, Activity, Smile, Sun, ListOrdered, MessageCircle, Shield, AlertTriangle, CheckCircle, Info, MapPin, User, Sliders, CalendarDays, Clock, Timer, Package, CreditCard, HelpCircle } from 'lucide-react'

const faqItems = [
  { id: 1, q: 'Faut-il savoir lire la musique ?', a: '<strong>Non !</strong> Le solfège n\'est pas nécessaire pour prendre des <strong>cours de chant</strong>. Nous travaillons à l\'oreille et par l\'expérimentation.', tint: 'bento-tint-primary' },
  { id: 2, q: 'Je chante faux, est-ce que je peux progresser ?', a: '<strong>Absolument !</strong> La justesse se travaille. Avec des exercices adaptés, de la pratique et un bon accompagnement, tout le monde peut améliorer sa justesse vocale.', tint: 'bento-tint-primary-light' },
  { id: 3, q: 'À quelle fréquence prendre des cours ?', a: 'L\'idéal est <strong>1 cours toutes les 2 semaines minimum</strong>, avec de la pratique entre les cours. Un cours par semaine permet une progression encore plus rapide.', tint: 'bento-tint-accent' },
  { id: 4, q: 'Puis-je choisir les morceaux que je travaille ?', a: '<strong>Oui !</strong> Nous travaillons sur des morceaux qui vous plaisent, en respectant votre niveau et vos objectifs. Le plaisir est essentiel.', tint: 'bento-tint-teal' },
  { id: 5, q: 'Quelle est la durée d\'un cours ? Y a-t-il un cours d\'essai ?', a: 'Un <strong>cours individuel</strong> dure <strong>1 heure</strong>. Cours d\'essai : première séance <strong>1 h 30</strong> (1 h payante + 30 min offertes). Aucun engagement.', tint: 'bento-tint-primary' },
  { id: 6, q: 'Y a-t-il un âge minimum ou maximum ?', a: '<strong>Aucune limite d\'âge !</strong> J\'accompagne enfants, adolescents, adultes et seniors. L\'enseignement s\'adapte à chaque âge.', tint: 'bento-tint-accent' },
]

function FaqCard({ item }: { item: typeof faqItems[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-bento-card glass-panel-rose ${item.tint} rounded-2xl relative overflow-hidden`} role="listitem">
      <button type="button" className="faq-bento-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{item.q}</span>
        <span className={`faq-bento-icon material-symbols-outlined ${open ? 'rotate-180' : ''} transition-transform duration-250`} aria-hidden="true">expand_more</span>
      </button>
      <div className="faq-bento-panel" style={{ maxHeight: open ? '320px' : '0' }}>
        <div className="faq-bento-panel-inner" dangerouslySetInnerHTML={{ __html: item.a }} />
      </div>
    </div>
  )
}

export default function CoursChantPage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12" aria-label="Hero">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[4.6rem] lg:text-[5.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Cours de</span>
              <span className="hero-gradient-word block">chant</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {[
                { href: '#pour-qui', label: 'Pour qui ?' },
                { href: '#approche', label: 'Mon approche' },
                { href: '#benefices', label: 'Les bénéfices' },
                { href: '#tarifs', label: 'Tarifs' },
                { href: '#faq', label: 'FAQ' },
              ].map((l) => (
                <a key={l.href} href={l.href} className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            Développez votre voix avec <strong>écoute et technique</strong>. Coaching vocal personnalisé, technique vocale et prévention vocale à Toulouse, quartier Minimes. Tous niveaux bienvenus.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-5xl mx-auto pb-24">
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="pour-qui">
          <h2 className="section-title-bentos">Pour qui sont les cours de chant ?</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x2 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" /></div>
              <p className="text-lg font-medium m-0">Les <strong>cours de chant à Toulouse</strong> s&apos;adressent à tous, <strong>sans limite d&apos;âge ou de niveau</strong>.</p>
              <p className="m-0 mt-2">Chaque voix est unique, et mon rôle de <strong>coach vocal</strong> est de vous accompagner là où vous en êtes.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Mic className="bento-icon" /></div>
              <h3>Débutants</h3>
              <p className="m-0 text-sm">Découvrir sa voix, apprendre les bases, gagner en confiance.</p>
              <h3 className="mt-4">Chanteurs confirmés</h3>
              <p className="m-0 text-sm">Perfectionner sa technique, élargir sa tessiture.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Briefcase className="bento-icon" /></div>
              <h3>Professions vocales</h3>
              <p className="mb-0 text-sm">Enseignants, comédiens : préserver et optimiser sa voix professionnelle.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Music className="bento-icon" /></div>
              <h3>Musiciens</h3>
              <p className="mb-0 text-sm">Travailler le <strong>chant</strong> en parallèle de votre instrument.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sparkles className="bento-icon" /></div>
              <p className="m-0 text-sm">Tous niveaux bienvenus ! Mon rôle est de vous accompagner avec vos objectifs propres.</p>
              <Link href="/contact" className="btn-rdv mt-auto">Prendre RDV pour un cours d&apos;essai</Link>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="approche">
          <h2 className="section-title-bentos">Mon approche pédagogique</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Heart className="bento-icon" /></div>
              <p className="text-base m-0">Une approche centrée sur <strong>l&apos;écoute</strong>, la <strong>bienveillance</strong> et l&apos;<strong>adaptation à votre singularité</strong>.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Award className="bento-icon" /></div>
              <h3>Formation certifiée</h3>
              <p className="m-0 text-sm">Formée à l&apos;<strong>approche Chant Voix et Corps</strong> d&apos;Emmanuelle Trinquesse, méthode scientifique et globale de la technique vocale reconnue en France.</p>
              <h3 className="mt-4">Ce qui me différencie</h3>
              <p className="m-0 text-sm"><strong>Approche holistique</strong> – Corps, voix et émotion sont liés. <strong>Bienveillance</strong> – Pas de jugement. <strong>Technique adaptative</strong> – Chaque voix est unique.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Target className="bento-icon" /></div>
              <h3>Cadre sécurisant</h3>
              <p className="mb-0 text-sm">Progression à votre rythme. Pas de jugement.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Layers className="bento-icon" /></div>
              <p className="m-0 text-sm">Ma méthode s&apos;adapte à <strong>vos</strong> besoins, pas l&apos;inverse.</p>
              <Link href="/impro-vocale" className="btn-rdv mt-auto">Découvrir l&apos;impro vocale</Link>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="benefices">
          <h2 className="section-title-bentos">Les bénéfices des cours de chant</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Music2 className="bento-icon" /></div>
              <h3>Améliorer la justesse</h3>
              <p className="m-0 text-sm">Développer votre oreille musicale et chanter juste.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Volume2 className="bento-icon" /></div>
              <h3>Gagner en puissance</h3>
              <p className="m-0 text-sm">Augmenter le volume sans forcer, grâce à une <strong>technique vocale</strong> adaptée.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Wind className="bento-icon" /></div>
              <h3>Maîtriser la respiration</h3>
              <p className="m-0 text-sm">Respiration adaptée au chant pour tenir les notes.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Activity className="bento-icon" /></div>
              <h3>Agilité vocale</h3>
              <p className="m-0 text-sm">Gagner en souplesse, explorer votre tessiture.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Smile className="bento-icon" /></div>
              <h3>Interprétation &amp; confiance</h3>
              <p className="m-0 text-sm">Transmettre des émotions, donner du sens à votre chant. Oser sa voix en toute sécurité.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sun className="bento-icon" /></div>
              <p className="mb-0 text-sm">Un travail global : vocal, corporel et émotionnel.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="tarifs">
          <h2 className="section-title-bentos">Tarifs</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Clock className="bento-icon" /></div>
              <h3>Cours d&apos;une heure</h3>
              <p className="m-0 text-sm"><strong>60 €</strong> – Coaching personnalisé.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Timer className="bento-icon" /></div>
              <h3>Cours 1h30</h3>
              <p className="m-0 text-sm"><strong>75 €</strong> – Séance plus longue pour approfondir.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Package className="bento-icon" /></div>
              <h3>Pack 4 cours</h3>
              <p className="m-0 text-sm"><strong>200 €</strong> le pack de 4 cours d&apos;une heure – soit 50 € le cours, à utiliser sous 2 mois.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-mix p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><CreditCard className="bento-icon" /></div>
              <h3>Modalités de règlement</h3>
              <p className="m-0 text-sm">CB, virement, PayPal, espèces. <strong>Tout cours non annulé au moins 24 h à l&apos;avance est dû.</strong></p>
              <Link href="/contact" className="btn-rdv mt-auto">Prendre RDV</Link>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="faq">
          <h2 className="section-title-bentos">Questions fréquentes sur les cours de chant</h2>
          <p className="mb-6 text-white/90 text-sm">Cliquez sur une question pour afficher la réponse.</p>
          <div className="faq-bento-zone">
            {faqItems.map((item) => <FaqCard key={item.id} item={item} />)}
            <div className="faq-bento-cta glass-panel-rose bento-tint-mix rounded-2xl p-6 text-center bento-content-glass relative overflow-hidden">
              <div className="bento-icon-wrap flex justify-center"><HelpCircle className="bento-icon" /></div>
              <h3 className="mt-0 text-lg font-semibold text-white">Une autre question ?</h3>
              <p className="mb-4 text-sm text-white/90">Je me tiens à votre disposition.</p>
              <Link href="/contact" className="btn-rdv">Contactez-moi</Link>
            </div>
          </div>
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
