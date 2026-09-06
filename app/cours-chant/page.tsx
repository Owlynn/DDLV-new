import type { Metadata } from 'next'
import Link from 'next/link'
import SocialBar from '@/components/SocialBar'
import FaqCard from '@/components/FaqCard'
import { stripHtml } from '@/lib/text'
import { Users, Mic, Briefcase, Music, Sparkles, Heart, Award, Target, Layers, Music2, Volume2, Wind, Activity, Smile, Sun, ListOrdered, MessageCircle, Shield, AlertTriangle, CheckCircle, Info, MapPin, User, Sliders, CalendarDays, Clock, Timer, Package, CreditCard, HelpCircle, Flame } from 'lucide-react'

const title = 'Cours de Chant à Toulouse | Coach Vocal Certifié'
const description = "Cours de chant individuels à Toulouse (quartier Minimes) avec Jessalynn, coach vocal certifiée. Technique vocale, tous niveaux, cours d'essai possible."
const url = 'https://donnerdelavoix.fr/cours-chant'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url },
  twitter: { title, description },
}

const faqItems = [
  { id: 1, question: 'Faut-il savoir lire la musique ?', answer: '<strong>Non !</strong> Le solfège n\'est pas nécessaire pour prendre des <strong>cours de chant</strong>. Nous travaillons à l\'oreille et par l\'expérimentation.', tint: 'bento-tint-primary' },
  { id: 2, question: 'Je chante faux, est-ce que je peux progresser ?', answer: '<strong>Absolument !</strong> La justesse se travaille. Avec des exercices adaptés, de la pratique et un bon accompagnement, tout le monde peut améliorer sa justesse vocale.', tint: 'bento-tint-primary-light' },
  { id: 3, question: 'À quelle fréquence prendre des cours ?', answer: 'L\'idéal est <strong>1 cours toutes les 2 semaines minimum</strong>, avec de la pratique entre les cours. Un cours par semaine permet une progression encore plus rapide.', tint: 'bento-tint-accent' },
  { id: 4, question: 'Puis-je choisir les morceaux que je travaille ?', answer: '<strong>Oui !</strong> Nous travaillons sur des morceaux qui vous plaisent, en respectant votre niveau et vos objectifs. Le plaisir est essentiel.', tint: 'bento-tint-teal' },
  { id: 5, question: 'Quelle est la durée d\'un cours ? Y a-t-il un cours d\'essai ?', answer: 'Un <strong>cours individuel</strong> dure <strong>1 heure</strong>. Cours d\'essai : première séance <strong>1 h 30</strong> (1 h payante + 30 min offertes). Aucun engagement.', tint: 'bento-tint-primary' },
  { id: 6, question: 'Y a-t-il un âge minimum ou maximum ?', answer: '<strong>Aucune limite d\'âge !</strong> J\'accompagne enfants, adolescents, adultes et seniors. L\'enseignement s\'adapte à chaque âge.', tint: 'bento-tint-accent' },
  { id: 7, question: 'Qu\'est-ce que le belting, et est-ce dangereux pour la voix ?', answer: 'Le <strong>belting</strong> est une technique qui permet de chanter puissamment dans l\'aigu, en gardant la couleur de la voix de poitrine, sans crier. Bien travaillé progressivement avec un accompagnement adapté, il ne présente pas de risque particulier.', tint: 'bento-tint-teal' },
  { id: 8, question: 'Quelle est la différence entre voix de poitrine, voix de tête et voix mixte ?', answer: '<strong>Voix de poitrine</strong> et <strong>voix de tête</strong> sont les deux registres naturels de la voix. La <strong>voix mixte</strong> permet de passer de l\'un à l\'autre sans rupture, en gardant puissance et couleur sur toute la <strong>tessiture</strong>.', tint: 'bento-tint-primary-light' },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripHtml(item.answer),
    },
  })),
}

export default function CoursChantPage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="hero-overlay relative h-screen overflow-hidden flex items-center pt-20 sm:pt-24 pb-12" aria-label="Hero">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-10">
            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[4.6rem] lg:text-[5.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="block">Cours de</span>
              <span className="hero-gradient-word block">chant</span>
              <span className="block text-[1.3rem] sm:text-[1.6rem] md:text-[2rem] lg:text-[2.4rem] font-medium text-white/80 mt-1">à Toulouse</span>
            </h1>
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {[
                { href: '#pour-qui', label: 'Pour qui ?' },
                { href: '#approche', label: 'Mon approche' },
                { href: '#technique', label: 'Technique vocale' },
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
          <div className="bento-formats-zone bento-formats-zone--content" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-row items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Users className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="text-lg font-medium m-0">Les <strong>cours de chant à Toulouse</strong> s&apos;adressent à tous, <strong>sans limite d&apos;âge ou de niveau</strong>.</p>
                <p className="m-0">Chaque voix est unique, et mon rôle de <strong>coach vocal</strong> est de vous accompagner là où vous en êtes.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-row-reverse items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Mic className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3>Débutants</h3>
                <p className="m-0 text-sm">Découvrir sa voix, apprendre les bases, gagner en confiance.</p>
                <h3 className="mt-2">Chanteurs confirmés</h3>
                <p className="m-0 text-sm">Perfectionner sa technique, élargir sa tessiture.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-row items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Briefcase className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3>Professions vocales</h3>
                <p className="mb-0 text-sm">Enseignants, comédiens : préserver et optimiser sa voix professionnelle.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-row-reverse items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Music className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3>Musiciens</h3>
                <p className="mb-0 text-sm">Travailler le <strong>chant</strong> en parallèle de votre instrument.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-row items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Sparkles className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="m-0 text-sm">Tous niveaux bienvenus ! Mon rôle est de vous accompagner avec vos objectifs propres.</p>
                <Link href="/contact" className="btn-rdv self-start">Prendre RDV pour un cours d&apos;essai</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="approche">
          <h2 className="section-title-bentos">Mon approche pédagogique</h2>
          <div className="bento-formats-zone bento-formats-zone--content" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-row items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Heart className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="text-base m-0">Une approche centrée sur <strong>l&apos;écoute</strong>, la <strong>bienveillance</strong> et l&apos;<strong>adaptation à votre singularité</strong>.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-row-reverse items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Award className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3>Formation certifiée</h3>
                <p className="m-0 text-sm">Formée à l&apos;<strong>approche Chant Voix et Corps</strong> d&apos;Emmanuelle Trinquesse, méthode scientifique et globale de la technique vocale reconnue en France.</p>
                <h3 className="mt-2">Ce qui me différencie</h3>
                <p className="m-0 text-sm"><strong>Approche holistique</strong> – Corps, voix et émotion sont liés. <strong>Bienveillance</strong> – Pas de jugement. <strong>Technique adaptative</strong> – Chaque voix est unique.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-row items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Target className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3>Cadre sécurisant</h3>
                <p className="mb-0 text-sm">Progression à votre rythme. Pas de jugement.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-row-reverse items-center gap-4 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap" style={{ width: 'auto', marginBottom: 0 }}><Layers className="bento-icon" style={{ width: '4rem', height: '4rem' }} /></div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="m-0 text-sm">Ma méthode s&apos;adapte à <strong>vos</strong> besoins, pas l&apos;inverse.</p>
                <Link href="/impro-vocale" className="btn-rdv self-start">Découvrir l&apos;impro vocale</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="technique">
          <h2 className="section-title-bentos">Les techniques vocales travaillées</h2>
          <div className="bento-formats-zone bento-formats-zone--content">
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Wind className="bento-icon" /></div>
              <h3>Respiration &amp; soutien</h3>
              <p className="m-0 text-sm">Respiration diaphragmatique et <strong>soutien vocal</strong> : la base de toute <strong>technique vocale</strong> solide.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><MapPin className="bento-icon" /></div>
              <h3>Placement de la voix</h3>
              <p className="m-0 text-sm">Trouver la bonne <strong>pose de voix</strong> pour chanter sans forcer ni fatiguer les cordes vocales.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Sliders className="bento-icon" /></div>
              <h3>Voix de poitrine, de tête, voix mixte</h3>
              <p className="m-0 text-sm">Identifier ses <strong>registres vocaux</strong> et apprendre à passer de l&apos;un à l&apos;autre sans rupture.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-primary-light p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Flame className="bento-icon" /></div>
              <h3>Belting</h3>
              <p className="m-0 text-sm">Chanter puissant dans l&apos;aigu sans crier : le <strong>belting</strong> se travaille progressivement, à votre rythme.</p>
            </div>
            <div className="bento-f-1x1 glass-panel-rose bento-tint-accent p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Shield className="bento-icon" /></div>
              <h3>Hygiène &amp; prévention vocale</h3>
              <p className="m-0 text-sm">Préserver sa voix sur le long terme, en particulier pour les <strong>professions vocales</strong> (enseignants, comédiens).</p>
            </div>
            <div className="bento-f-2x1 glass-panel-rose bento-tint-mix p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass">
              <div className="bento-icon-wrap"><Heart className="bento-icon" /></div>
              <h3>La technique au service de l&apos;interprétation</h3>
              <p className="m-0 text-sm">Respiration, placement, belting, voix mixte : ces outils ne sont jamais une fin en soi. Ils sont là pour se mettre au service de <strong>l&apos;interprétation</strong> et de <strong>l&apos;émotion</strong> à transmettre.</p>
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-1">
                <div className="bento-icon-wrap"><Clock className="bento-icon" /></div>
                <h3>Cours d&apos;une heure</h3>
                <p className="m-0 text-sm"><strong>60 €</strong> – Coaching personnalisé.</p>
              </div>
              <div className="glass-panel-rose bento-tint-teal p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-1">
                <div className="bento-icon-wrap"><Timer className="bento-icon" /></div>
                <h3>Cours 1h30</h3>
                <p className="m-0 text-sm"><strong>75 €</strong> – Séance plus longue pour approfondir.</p>
              </div>
              <div className="glass-panel-rose bento-tint-primary p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-1">
                <div className="bento-icon-wrap"><Package className="bento-icon" /></div>
                <h3>Pack 4 cours</h3>
                <p className="m-0 text-sm"><strong>200 €</strong> le pack de 4 cours d&apos;une heure – soit 50 € le cours, à utiliser sous 2 mois.</p>
              </div>
            </div>
            <div className="glass-panel-rose bento-tint-mix p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-1">
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
          <div className="faq-bento-zone" style={{ display: 'flex', flexDirection: 'column' }}>
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
