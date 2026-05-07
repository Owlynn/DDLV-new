'use client'

import { useState } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import { Mic, Users, CircleDot, Ear, Music2, Layers, Heart, Sparkles, Wind, Link as LinkIcon, Sun, MapPin, Compass, CalendarDays, MicVocal, HelpCircle } from 'lucide-react'

const faqItems = [
  {
    id: 1,
    question: "Faut-il savoir chanter pour faire de l'improvisation vocale ?",
    answer: "<strong>Non, aucun prérequis n'est nécessaire.</strong> L'<strong>impro vocale</strong> est accessible à tous, que vous ayez déjà pris des <strong>cours de chant</strong> ou non. C'est même une excellente porte d'entrée pour découvrir sa voix sans pression ni jugement.",
    tint: 'bento-tint-primary',
  },
  {
    id: 2,
    question: "Quelle est la différence entre circle song et circlesong ?",
    answer: "C'est la même chose ! Les deux orthographes sont utilisées. Un <strong>circle song</strong> (ou <strong>circlesong</strong>) est une forme d'<strong>improvisation vocale</strong> collective où un leader distribue des motifs vocaux aux participants pour créer une <strong>polyphonie improvisée</strong>.",
    tint: 'bento-tint-primary-light',
  },
  {
    id: 3,
    question: "C'est quoi le vocal painting ?",
    answer: "Le <strong>vocal painting</strong> est un langage gestuel qui permet à un chef ou <strong>coach vocal</strong> de guider un groupe en improvisation. C'est un outil de communication qui facilite la création collective en temps réel sans figer la spontanéité.",
    tint: 'bento-tint-accent',
  },
  {
    id: 4,
    question: "Peut-on pratiquer l'improvisation vocale seul.e ?",
    answer: "Oui, mais la magie de l'<strong>impro vocale</strong> se révèle surtout en groupe ! Les <strong>circlesongs</strong> et la co-improvisation créent une dynamique collective unique. Cela dit, s'entraîner seul.e est aussi très enrichissant pour explorer sa voix.",
    tint: 'bento-tint-teal',
  },
  {
    id: 5,
    question: "L'improvisation vocale remplace-t-elle les cours de chant traditionnels ?",
    answer: "Pas nécessairement. L'<strong>impro vocale</strong> et la <strong>technique vocale</strong> s'enrichissent mutuellement. Beaucoup de pratiquants combinent les deux approches : les <strong>cours de chant</strong> pour développer la technique, et l'<strong>improvisation vocale</strong> pour nourrir la créativité et la spontanéité.",
    tint: 'bento-tint-mix',
  },
  {
    id: 6,
    question: "Où pratiquer l'improvisation vocale à Toulouse ?",
    answer: "Je propose des <strong>stages et ateliers réguliers d'improvisation vocale et de circlesongs à Toulouse</strong>, accessibles à tous les niveaux. Vous pouvez <a href='/ateliers'>consulter le calendrier des stages et ateliers</a> ou <a href='/contact'>me contacter</a> pour plus d'informations. Je propose également des <strong>cours de chant à Toulouse</strong> intégrant l'improvisation.",
    tint: 'bento-tint-accent',
  },
]

function FaqCard({ item }: { item: typeof faqItems[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-bento-card glass-panel-rose ${item.tint} rounded-2xl relative overflow-hidden`} role="listitem">
      <button
        type="button"
        className="faq-bento-trigger"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{item.question}</span>
        <span className={`faq-bento-icon material-symbols-outlined ${open ? 'rotate-180' : ''} transition-transform duration-250`} aria-hidden="true">expand_more</span>
      </button>
      <div className={`faq-bento-panel ${open ? 'is-open' : ''}`} style={{ maxHeight: open ? '320px' : '0' }}>
        <div className="faq-bento-panel-inner" dangerouslySetInnerHTML={{ __html: item.answer }} />
      </div>
    </div>
  )
}

export default function ImproVocalePage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-12" aria-label="Hero">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[4.6rem] lg:text-[5.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Impro</span>
              <span className="hero-gradient-word block">vocale</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {[
                { href: '#intro', label: "Qu'est-ce que l'impro vocale ?" },
                { href: '#bienfaits', label: 'Les bienfaits' },
                { href: '#toulouse', label: 'Pratiquer à Toulouse' },
                { href: '#faq', label: 'Questions fréquentes' },
              ].map((l) => (
                <a key={l.href} href={l.href} className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                  {l.label}
                </a>
              ))}
              <Link href="/ateliers" className="btn-rdv w-full sm:w-auto text-center">Stages &amp; ateliers</Link>
            </nav>
          </div>
          <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            L&apos;<strong>improvisation vocale</strong> est une pratique musicale où la voix devient un instrument de création spontanée. Pas de partition, pas de texte à mémoriser : la musique naît dans l&apos;instant, à partir de l&apos;écoute et de l&apos;intuition.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-5xl mx-auto pb-24">
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="intro">
          <h2 className="section-title-bentos">Qu&apos;est-ce que l&apos;impro vocale ?</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x2 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Mic className="bento-icon" aria-hidden="true" /></div>
              <p className="text-lg font-medium m-0"><strong>L&apos;improvisation vocale</strong> est une pratique musicale où la voix devient un instrument de création spontanée. Ici, pas de partition à suivre, pas de texte à mémoriser, pas d&apos;objectif de performance.</p>
              <p className="m-0 mt-2">La musique naît dans l&apos;instant, à partir de l&apos;écoute, de l&apos;intuition et de ce qui se passe ici et maintenant.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0"><strong>Accessible à tous les niveaux</strong> – L&apos;improvisation vocale s&apos;adresse autant aux débutants qu&apos;aux chanteurs expérimentés.</p>
              <p className="text-base font-semibold m-0 mt-auto"><strong>Aucun prérequis n&apos;est nécessaire</strong>.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><CircleDot className="bento-icon" aria-hidden="true" /></div>
              <h3>Co-improvisation et circlesongs</h3>
              <p className="mb-0 text-sm">Dans la <strong>co-improvisation</strong>, les voix dialoguent de manière horizontale, sans leader.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Ear className="bento-icon" aria-hidden="true" /></div>
              <h3>L&apos;écoute et la communication</h3>
              <p className="mb-0 text-sm">Au cœur de l&apos;impro se trouve <strong>l&apos;écoute</strong> : écouter les autres, s&apos;écouter soi-même.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Music2 className="bento-icon" aria-hidden="true" /></div>
              <h3>Technique vocale et impro</h3>
              <p className="mb-3 text-sm">L&apos;impro développe la conscience du souffle, le placement vocal, l&apos;exploration de la tessiture.</p>
              <Link href="/cours-chant" className="btn-rdv mt-auto">Découvrir mes cours de chant</Link>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Layers className="bento-icon" aria-hidden="true" /></div>
              <p className="mb-0 text-sm">Le <strong>circle song</strong> : un leader distribue des motifs vocaux qui s&apos;assemblent en une <strong>polyphonie improvisée</strong>.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="bienfaits">
          <h2 className="section-title-bentos">Les bienfaits de l&apos;impro vocale</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Heart className="bento-icon" aria-hidden="true" /></div>
              <p className="text-base m-0">Au-delà du plaisir musical, l&apos;<strong>improvisation vocale</strong> apporte de nombreux bienfaits, tant artistiques que personnels.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sparkles className="bento-icon" aria-hidden="true" /></div>
              <h3>Créativité et spontanéité</h3>
              <p className="m-0 text-sm">L&apos;<strong>impro vocale</strong> réveille votre créativité naturelle.</p>
              <h3 className="mt-4">Confiance en soi</h3>
              <p className="m-0 text-sm">Dans un cadre bienveillant, vous apprenez à faire confiance à votre instinct vocal.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Wind className="bento-icon" aria-hidden="true" /></div>
              <h3>Lâcher-prise</h3>
              <p className="m-0 text-sm">Accepter l&apos;imperfection, accueillir l&apos;erreur comme une opportunité.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><LinkIcon className="bento-icon" aria-hidden="true" /></div>
              <h3>Écoute et connexion</h3>
              <p className="m-0 text-sm">Pratiquer les <strong>circlesongs</strong> développe une écoute fine et une capacité à créer ensemble.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sun className="bento-icon" aria-hidden="true" /></div>
              <h3>Présence</h3>
              <p className="m-0 text-sm">L&apos;<strong>improvisation vocale</strong> vous ramène au moment présent. C&apos;est une forme de méditation active.</p>
              <h3>Plaisir et jeu</h3>
              <p className="m-0 text-sm">Avant tout, l&apos;<strong>impro vocale</strong> c&apos;est du plaisir !</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="toulouse">
          <h2 className="section-title-bentos">Pratiquer à Toulouse</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-1x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><MapPin className="bento-icon" aria-hidden="true" /></div>
              <p className="text-base m-0">Vous souhaitez découvrir l&apos;<strong>improvisation vocale à Toulouse</strong> ? Je propose des stages et ateliers réguliers dans une ambiance bienveillante et créative.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Compass className="bento-icon" aria-hidden="true" /></div>
              <h3>Ma philosophie</h3>
              <ul className="text-sm mb-0 list-disc pl-4 space-y-1">
                <li>Chaque voix est accueillie telle qu&apos;elle est</li>
                <li>L&apos;exploration prime sur la performance</li>
                <li>Le plaisir et le jeu sont au cœur de la pratique</li>
                <li>La bienveillance et l&apos;écoute guident nos créations</li>
              </ul>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><CalendarDays className="bento-icon" aria-hidden="true" /></div>
              <h3>Stages &amp; ateliers</h3>
              <ul className="text-sm mb-0 list-disc pl-4 space-y-1">
                <li>Les <strong>circlesongs</strong> : polyphonies improvisées guidées</li>
                <li>La co-improvisation libre</li>
                <li>Le <strong>vocal painting</strong></li>
                <li>L&apos;exploration vocale : sons, textures, rythmes, silences</li>
              </ul>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0 text-sm">Débutant.e ou musicien.ne expérimenté.e, vous trouverez votre place dans ces stages et ateliers.</p>
            </div>
            <div className="bento-f-2x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden bento-content-glass text-center items-center justify-center">
              <div className="bento-icon-wrap"><MicVocal className="bento-icon" aria-hidden="true" /></div>
              <h3 className="mt-0 text-lg">Rejoignez les stages &amp; ateliers d&apos;impro vocale à Toulouse</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/ateliers" className="btn-rdv">Voir les stages &amp; ateliers</Link>
                <Link href="/contact" className="btn-rdv">Me contacter</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="faq">
          <h2 className="section-title-bentos">Questions fréquentes sur l&apos;improvisation vocale</h2>
          <p className="mb-6 text-white/90 text-sm">Cliquez sur une question pour afficher la réponse.</p>
          <div className="faq-bento-zone">
            {faqItems.map((item) => <FaqCard key={item.id} item={item} />)}
            <div className="faq-bento-cta glass-panel-rose bento-tint-mix rounded-2xl p-6 text-center bento-content-glass relative overflow-hidden">
              <div className="bento-icon-wrap flex justify-center"><HelpCircle className="bento-icon" aria-hidden="true" /></div>
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
