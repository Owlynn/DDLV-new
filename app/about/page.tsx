import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SocialBar from '@/components/SocialBar'
import { Heart, Mic, Calendar, Sparkles, GraduationCap, User, Palette, Music, Target, BookOpen, Briefcase, Users, PenLine, Mic2, CalendarDays, MessageCircle, ArrowRight } from 'lucide-react'

const title = 'Jessalynn | Professeur de Chant Certifié & Coach Vocal Toulouse'
const description = 'Rencontrez Jessalynn, professeur de chant certifié à Toulouse depuis 10 ans. Formée à l\'approche Chant Voix et Corps d\'Emmanuelle Trinquesse. Spécialisée en improvisation vocale, circlesongs et technique vocale.'
const url = 'https://donnerdelavoix.fr/about'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url },
  twitter: { title, description },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jessalynn Choby',
  jobTitle: 'Professeur de chant certifié & coach vocal',
  description,
  url,
  worksFor: {
    '@type': 'LocalBusiness',
    name: 'Donner de la Voix',
    url: 'https://donnerdelavoix.fr',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Toulouse',
    addressCountry: 'FR',
  },
  sameAs: [
    'https://www.instagram.com/donnerdelavoixchant/',
    'https://www.facebook.com/donnerdelavoix',
  ],
}

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12 md:pb-12" aria-label="Hero">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[4.6rem] lg:text-[5.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word block">Donner de la voix</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {[
                { href: '#intro', label: 'Qui je suis' },
                { href: '#comment-tout-a-commence', label: 'Comment tout a commencé' },
                { href: '#comment-je-travaille', label: 'Comment je travaille' },
                { href: '#aujourdhui', label: "Aujourd'hui" },
                { href: '#rencontrer', label: 'Nous rencontrer' },
              ].map((l) => (
                <a key={l.href} href={l.href} className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
            Je suis <strong>professeur de chant et coach vocal à Toulouse</strong>. Avant tout, quelqu&apos;un qui aime la voix sous toutes ses formes—et qui kiffe voir les gens découvrir la leur.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-5xl mx-auto pb-24">
        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="intro">
          <h2 className="section-title-bentos">Qui je suis</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x2 glass-panel-rose bento-bg-blur bento-bg-jessalynn bento-tint-primary p-6 rounded-2xl flex flex-col justify-end relative overflow-hidden bento-content-glass min-h-[280px]">
              <h3 className="text-2xl font-bold mt-auto mb-2">Salut, moi c&apos;est Jessalynn</h3>
              <p className="m-0 text-base">Je suis professeur de chant et coach vocal à Toulouse. Mais avant tout, je suis quelqu&apos;un qui aime la voix sous toutes ses formes—et surtout, je kiffe voir les gens découvrir la leur.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Heart className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0 text-sm">Transmettre cette passion, accompagner chaque voix dans sa singularité : c&apos;est ce qui me motive au quotidien.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose rounded-2xl overflow-hidden p-0 h-full min-h-[160px] border border-white/20">
              <Image src="/assets/jessalynn-1.jpg" alt="Jessalynn, professeure de chant et coach vocal" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass items-center justify-center text-center">
              <div className="bento-icon-wrap"><Mic className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0 text-sm font-semibold">Voix, chant, impro, circlesongs</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="comment-tout-a-commence">
          <h2 className="section-title-bentos">Comment tout a commencé</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Calendar className="bento-icon" aria-hidden="true" /></div>
              <h3>2014, Lyon</h3>
              <p className="m-0 text-sm">Je cherchais des gens qui chantaient ensemble en inventant de la musique. On m&apos;a parlé de <strong>Chant Pour Tous</strong>, un mouvement d&apos;ateliers gratuits autour du chant improvisé.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sparkles className="bento-icon" aria-hidden="true" /></div>
              <p className="font-semibold m-0">Grosse claque.</p>
              <p className="m-0 text-sm">Une passion était née. Mais transmettre ? J&apos;en étais très loin.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose rounded-2xl overflow-hidden p-0 h-full min-h-[160px] border border-white/20">
              <Image src="/assets/jessalynn-3.jpg" alt="Jessalynn en atelier" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass justify-center text-center">
              <p className="m-0 text-sm">Tout a changé en <strong>2016</strong>.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><GraduationCap className="bento-icon" aria-hidden="true" /></div>
              <h3>Improvie &amp; Chant Voix et Corps</h3>
              <p className="m-0 text-sm">J&apos;ai commencé <strong>Improvie</strong>, une formation avec <strong>Gaël Aubrit</strong>. J&apos;ai enchaîné avec <strong>Chant Voix &amp; Corps</strong> d&apos;<strong>Emmanuelle Trinquesse</strong>—pour avoir les outils nécessaires pour vraiment libérer les voix.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="comment-je-travaille">
          <h2 className="section-title-bentos">Comment je travaille</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><User className="bento-icon" aria-hidden="true" /></div>
              <h3>Corps et humain au centre</h3>
              <p className="m-0 text-sm">Pas la technique isolée, pas la performance. Le corps dans sa globalité—posture, respiration, émotion, présence.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Palette className="bento-icon" aria-hidden="true" /></div>
              <h3>Créativité comme outil</h3>
              <p className="m-0 text-sm">L&apos;improvisation vocale n&apos;est pas un « plus »—c&apos;est comme ça qu&apos;on apprend. On joue, on explore, on se trompe, on recommence.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Music className="bento-icon" aria-hidden="true" /></div>
              <h3>Chaque voix est unique</h3>
              <p className="m-0 text-sm">Mon boulot c&apos;est de vous aider à trouver votre voix, celle qui vous ressemble vraiment.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose rounded-2xl overflow-hidden p-0 h-full min-h-[160px] border border-white/20">
              <Image src="/assets/jessalynn-2.jpg" alt="Jessalynn, coach vocal" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Target className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0 text-sm">Trois piliers indissociables : le corps, la créativité et la singularité de chaque voix.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="aujourdhui">
          <h2 className="section-title-bentos">Aujourd&apos;hui</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><BookOpen className="bento-icon" aria-hidden="true" /></div>
              <h3>Cours &amp; ateliers à Toulouse</h3>
              <p className="m-0 text-sm">Je propose des cours individuels et des stages &amp; ateliers collectifs de circlesongs et improvisation vocale.</p>
            </div>
            <div className="bento-f-1x2 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass bento-bg-blur bento-bg-jessalynn-2">
              <div className="bento-icon-wrap"><Briefcase className="bento-icon" aria-hidden="true" /></div>
              <h3>Impro en entreprise</h3>
              <p className="m-0 text-sm">Libérer la créativité, casser les rigidités, créer de la connexion. Pas du team-building cliché—quelque chose de vraiment transformateur.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose rounded-2xl overflow-hidden p-0 h-full min-h-[160px] border border-white/20">
              <Image src="/assets/about-atelier-groupe.jpg" alt="Jessalynn animant un atelier de circlesong en groupe à Toulouse" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Users className="bento-icon" aria-hidden="true" /></div>
              <p className="m-0 text-sm">Engagée auprès de <strong>Chant Pour Tous</strong> depuis <strong>2019</strong>, et du <a href="https://www.lecercleenchante.com" target="_blank" rel="noopener noreferrer"><strong>Cercle Enchanté</strong></a>.</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><PenLine className="bento-icon" aria-hidden="true" /></div>
              <h3>Écriture &amp; voix</h3>
              <p className="m-0 text-sm">Quand je ne chante pas, j&apos;écris. Suivez mes réflexions sur <a href="https://www.des-mots-silencieux.fr" target="_blank" rel="noopener noreferrer">des-mots-silencieux.fr</a>.</p>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="rencontrer">
          <h2 className="section-title-bentos">Envie de faire connaissance ?</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <Link href="/cours-chant" className="bento-f-2x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass group">
              <div className="bento-icon-wrap"><Mic2 className="bento-icon" aria-hidden="true" /></div>
              <h3>Voir les cours de chant</h3>
              <p className="m-0 text-sm">Cours individuels et collectifs à Toulouse. Premier cours avec 30 min offertes.</p>
              <span className="btn-rdv mt-auto inline-flex items-center gap-2">Découvrir <ArrowRight className="w-4 h-4" /></span>
            </Link>
            <Link href="/ateliers" className="bento-f-2x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass group">
              <div className="bento-icon-wrap"><CalendarDays className="bento-icon" aria-hidden="true" /></div>
              <h3>Stages &amp; ateliers</h3>
              <p className="m-0 text-sm">Stages et ateliers de circlesongs et improvisation vocale.</p>
              <span className="btn-rdv mt-auto inline-flex items-center gap-2">Voir les stages &amp; ateliers <ArrowRight className="w-4 h-4" /></span>
            </Link>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><MessageCircle className="bento-icon" aria-hidden="true" /></div>
              <h3>Prendre rendez-vous</h3>
              <p className="m-0 text-sm mb-3">On peut aussi juste échanger.</p>
              <Link href="/contact" className="btn-rdv mt-auto inline-block w-fit">Me contacter</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-white/80 text-sm">Recevez les actualités : <Link href="/contact#newsletter" className="text-white underline underline-offset-2 hover:text-accent transition-colors">s&apos;abonner à la newsletter</Link>.</p>
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
