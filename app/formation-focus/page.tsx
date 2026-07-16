import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import SocialBar from '@/components/SocialBar'
import {
  Layers,
  Heart,
  Users,
  Compass,
  Sparkles,
  CalendarDays,
  Moon,
  Flame,
  Headphones,
  Mail,
  CalendarClock,
  Euro,
  ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Formation Focus | Formation co-improvisation et circlesong | Toulouse',
  description: 'Formation Focus : neuf mois pour développer sa technique, sa présence et son écoute du collectif en improvisation vocale, jusqu\'à un spectacle final. Toulouse, octobre 2026 → juin 2027.',
  alternates: { canonical: 'https://donnerdelavoix.fr/formation-focus' },
}

const piliers = [
  {
    num: 1,
    title: 'Les fondations',
    text: 'Gagner en compétences pour prendre confiance : pulse, écoute, réflexes d’impro, harmonie, arrangement, structure.',
    icon: Layers,
    tint: 'bento-tint-primary',
  },
  {
    num: 2,
    title: 'Être en soi',
    text: 'La posture intérieure de l’improvisatrice : aller plus loin que les compétences techniques, écouter ses ressentis, dépasser ses peurs.',
    icon: Heart,
    tint: 'bento-tint-accent',
  },
  {
    num: 3,
    title: 'Être ensemble',
    text: 'Co-construire la musique en collectif : écoute des autres, prise et partage du lead, dynamiques de groupe.',
    icon: Users,
    tint: 'bento-tint-teal',
  },
  {
    num: 4,
    title: 'Le chemin',
    text: 'Évoluer et progresser seul.e : pratique autonome entre les séances, enregistrements, retours personnalisés.',
    icon: Compass,
    tint: 'bento-tint-primary-light',
  },
  {
    num: 5,
    title: 'L’improvisation sur scène',
    text: 'Comment passer de la pratique en groupe à une démonstration artistique.',
    icon: Sparkles,
    tint: 'bento-tint-mix',
  },
]

const rythme = [
  {
    title: '13 séances le mercredi soir',
    text: 'Le socle de l’année : se retrouver régulièrement, ancrer les acquis, avancer pas à pas dans la durée.',
    icon: CalendarDays,
    tint: 'bento-tint-teal',
  },
  {
    title: '5 week-ends d’approfondissement',
    text: 'Le temps de plonger vraiment : prendre du recul, creuser un thème en profondeur et faire de grands bonds en avant.',
    icon: Moon,
    tint: 'bento-tint-primary',
  },
  {
    title: '3 soirées de pratique publique',
    text: 'Des soirées ouvertes à un public, pour créer du lien avec le groupe et s’habituer, en douceur, à improviser devant des gens.',
    icon: Flame,
    tint: 'bento-tint-accent',
  },
  {
    title: '2 coachings individuels',
    text: 'Un temps rien qu’à soi pour se concentrer sur ses propres points de facilité et de difficulté.',
    icon: Headphones,
    tint: 'bento-tint-primary-light',
  },
]

const dotColors: Record<string, string> = {
  mercredi: '#5ec8d8',
  weekend: '#8b6ec0',
  soiree: '#f0a830',
  rendu: '#e8789c',
}

const legend = [
  { type: 'mercredi', label: 'Mercredi' },
  { type: 'weekend', label: 'Week-end' },
  { type: 'soiree', label: 'Soirée publique' },
  { type: 'rendu', label: 'Rendu devoir' },
]

const events: Record<string, string> = {
  '2026-10-07': 'mercredi', '2026-10-21': 'mercredi',
  '2026-10-24': 'weekend', '2026-10-25': 'weekend',
  '2026-10-16': 'rendu',

  '2026-11-04': 'mercredi', '2026-11-18': 'mercredi',
  '2026-11-02': 'soiree',
  '2026-11-13': 'rendu', '2026-11-27': 'rendu',

  '2026-12-16': 'mercredi',
  '2026-12-19': 'weekend', '2026-12-20': 'weekend',
  '2026-12-18': 'rendu',

  '2027-01-06': 'mercredi', '2027-01-20': 'mercredi',
  '2027-01-15': 'rendu', '2027-01-29': 'rendu',

  '2027-02-17': 'mercredi',
  '2027-02-13': 'weekend', '2027-02-14': 'weekend',
  '2027-02-15': 'soiree',
  '2027-02-12': 'rendu', '2027-02-26': 'rendu',

  '2027-03-03': 'mercredi', '2027-03-17': 'mercredi', '2027-03-31': 'mercredi',
  '2027-03-12': 'rendu', '2027-03-26': 'rendu',

  '2027-04-28': 'mercredi',
  '2027-04-17': 'weekend', '2027-04-18': 'weekend',
  '2027-04-09': 'rendu', '2027-04-23': 'rendu',

  '2027-05-05': 'mercredi', '2027-05-19': 'mercredi',
  '2027-05-17': 'soiree',
  '2027-05-14': 'rendu', '2027-05-28': 'rendu',

  '2027-06-09': 'mercredi',
  '2027-06-12': 'weekend', '2027-06-13': 'weekend',
}

const calendarMonths: [number, number, string][] = [
  [2026, 9, 'Octobre 2026'],
  [2026, 10, 'Novembre 2026'],
  [2026, 11, 'Décembre 2026'],
  [2027, 0, 'Janvier 2027'],
  [2027, 1, 'Février 2027'],
  [2027, 2, 'Mars 2027'],
  [2027, 3, 'Avril 2027'],
  [2027, 4, 'Mai 2027'],
  [2027, 5, 'Juin 2027'],
]

const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function buildMonthCells(year: number, monthIdx: number) {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const startOffset = (new Date(year, monthIdx, 1).getDay() + 6) % 7
  const cells: { day: number | null; type?: string }[] = []
  for (let i = 0; i < startOffset; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, type: events[key] })
  }
  return cells
}

const prerequis = [
  { icon: '🥁', text: 'Savoir tenir une pulse' },
  { icon: '🎵', text: 'Chanter juste' },
  { icon: '🌱', text: 'Être en volonté de progresser' },
  { icon: '🤝', text: 'S’engager à ne pas rater de séances' },
]

const prerequisTints = ['bento-tint-teal', 'bento-tint-primary', 'bento-tint-accent', 'bento-tint-primary-light']

const beneficesFormation = [
  { icon: '🎯', text: 'Une vraie autonomie technique en improvisation vocale' },
  { icon: '🌿', text: 'Une posture personnelle affirmée face au trac et à l’interprétation' },
  { icon: '🤝', text: 'La capacité à écouter un groupe et à le guider en improvisation' },
  { icon: '🔁', text: 'Une pratique autonome installée dans la durée' },
  { icon: '🎭', text: 'L’expérience de la scène, jusqu’à un spectacle final' },
  { icon: '✨', text: 'Un groupe de 9 personnes avec qui continuer à pratiquer' },
]

const beneficesTints = ['bento-tint-accent', 'bento-tint-teal', 'bento-tint-primary', 'bento-tint-primary-light', 'bento-tint-mix', 'bento-tint-accent']

const infosPratiques = [
  {
    icon: Users,
    tint: 'bento-tint-primary',
    title: 'Groupe & lieu',
    items: [
      { label: 'Groupe', value: '9 personnes maximum' },
      { label: 'Lieu', value: 'Toulouse, accessible en transports (adresse communiquée à l’inscription)' },
    ],
  },
  {
    icon: CalendarClock,
    tint: 'bento-tint-teal',
    title: 'Durée',
    items: [
      { label: 'Durée', value: 'Octobre 2026 → Juin 2027' },
      { label: 'Heures de formation', value: '126h' },
    ],
  },
  {
    icon: Euro,
    tint: 'bento-tint-accent',
    title: 'Tarif',
    items: [
      { label: 'Tarif', value: '850 € / an' },
      { label: 'Soit par mois', value: '≈ 94 € / mois' },
      { label: 'Soit par heure de formation', value: '≈ 6,75 € / heure' },
      { label: 'Paiement', value: 'En autant de fois que nécessaire' },
    ],
  },
]

const candidature = [
  { step: 1, text: 'Remplir le formulaire de candidature' },
  { step: 2, text: 'Si Jessalynn ne vous connaît pas déjà : envoyer un extrait d’impro au looper ou un enregistrement d’impro en groupe' },
  { step: 3, text: 'Si ce n’est pas possible : une courte rencontre est proposée pour une micro-audition' },
]

export default function FormationFocusPage() {
  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative min-h-screen overflow-hidden flex items-center pt-28 sm:pt-32 pb-12" aria-label="Hero">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 flex flex-col items-start gap-6 sm:gap-8">
          <p className="text-white/80 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] m-0">
            Formation co-improvisation et circlesong · Octobre 2026 → Juin 2027
          </p>
          <h1 className="text-[2rem] sm:text-[2.6rem] md:text-[3.6rem] font-bold tracking-tight text-white leading-tight m-0">
            <span className="hero-gradient-word block">Formation Focus</span>
            <span className="block">l&apos;improvisation vocale, des bases jusqu&apos;à la scène</span>
          </h1>
          <p className="text-white/90 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl m-0">
            Neuf mois pour développer sa technique, sa présence et son écoute du collectif, jusqu&apos;à un spectacle final.
          </p>
          <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto mt-2" aria-label="Sommaire">
            {[
              { href: '#piliers', label: 'Les piliers' },
              { href: '#calendrier', label: 'Calendrier' },
              { href: '#pedagogue', label: 'La formatrice' },
              { href: '#infos-pratiques', label: 'Infos & tarif' },
              { href: '#candidater', label: 'Candidater' },
            ].map((l) => (
              <a key={l.href} href={l.href} className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="px-4 md:px-8 max-w-5xl mx-auto pb-24">
        <section className="mb-12 md:mb-16 scroll-mt-28">
          <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto text-center">
            Chanter en improvisation, ce n&apos;est pas qu&apos;une question de technique. C&apos;est apprendre à s&apos;écouter, à écouter les autres, et à trouver sa place dans un collectif qui invente la musique en temps réel. Cette formation avance sur quatre piliers complémentaires, du premier mercredi jusqu&apos;au spectacle final.
          </p>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28" id="piliers">
          <h2 className="section-title-bentos">Une formation, cinq piliers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {piliers.map((p, i) => {
              const Icon = p.icon
              const isLast = i === piliers.length - 1
              return (
                <div key={p.num} className={`${isLast ? 'sm:col-span-2' : ''} glass-panel-rose ${p.tint} p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass`}>
                  <div className="bento-icon-wrap justify-start"><Icon className="bento-icon !w-10 !h-10" /></div>
                  <h3 className="m-0">{p.num}. {p.title}</h3>
                  <p className="m-0 text-sm">{p.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="formats-bentos-section mb-12 md:mb-16 scroll-mt-28">
          <h2 className="section-title-bentos">Le rythme de l&apos;année</h2>
          <p className="text-white/80 text-sm mb-4">Un format pensé pour avancer en continu, sans rythme épuisant.</p>
          <div className="bento-formats-zone bento-formats-zone--content">
            {rythme.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.title} className={`bento-f-1x1 glass-panel-rose ${r.tint} p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden bento-content-glass`}>
                  <div className="bento-icon-wrap justify-start"><Icon className="bento-icon !w-10 !h-10" /></div>
                  <h3 className="m-0 text-base">{r.title}</h3>
                  <p className="m-0 text-sm">{r.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28">
          <h2 className="section-title-bentos">Une pratique qui continue entre les séances</h2>
          <div className="glass-panel-rose bento-tint-primary-light rounded-2xl p-6 md:p-8 bento-content-glass flex flex-col gap-4">
            <p className="m-0 text-sm">
              Progresser en improvisation, c&apos;est aussi une affaire de régularité personnelle. Entre chaque séance, un exercice est proposé à réaliser seul.e avec un looper, à enregistrer et à déposer sur un espace commun. Les retours se font au sein du groupe : chacun.e écoute et commente les propositions des autres, et Jessalynn intervient également, sans pour autant faire un retour individuel systématique à chaque personne à chaque fois. Une manière concrète de garder le fil, même les semaines sans cours.
            </p>
            <p className="m-0 text-sm">
              Côté matériel : un looper (physique, ou une application comme Loopy Pro sur iOS ou Loopify sur Android) et un micro suffisent pour pratiquer chez soi. Mutualiser le matériel entre participant.e.s et s&apos;organiser des sessions d&apos;impro à plusieurs entre les séances est vivement encouragé.
            </p>
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28">
          <div className="rounded-2xl p-8 md:p-10 text-center bg-gradient-to-br from-[#3a2560] to-[#5a3080] border border-white/10">
            <h3 className="text-xl font-bold text-white m-0 mb-3">✨ Un spectacle pour clore l&apos;année</h3>
            <p className="text-white/85 text-sm max-w-xl mx-auto m-0">
              L&apos;improvisation vocale est un art à part entière, qui peut se présenter devant un public au même titre qu&apos;un spectacle écrit à l&apos;avance. Apprendre à passer de la pratique en groupe à une proposition artistique fait donc pleinement partie de la formation : les 3 soirées de pratique publique pendant l&apos;année préparent progressivement le groupe à cet exercice, en douceur.
            </p>
            <p className="text-white/85 text-sm max-w-xl mx-auto m-0 mt-3">
              La formation se termine ainsi par une restitution publique fin juin : un vrai spectacle, fruit collectif de neuf mois de pratique, où le groupe met en scène ce qu&apos;il a construit ensemble.
            </p>
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28" id="pedagogue">
          <h2 className="section-title-bentos">À propos de la formatrice</h2>
          <div className="glass-panel-rose bento-tint-mix rounded-2xl p-6 md:p-8 bento-content-glass flex flex-col gap-4">
            <p className="m-0 text-sm">
              Jessalynn est professeure de chant et coach vocal depuis dix ans, installée à Toulouse depuis 2023. Formée pendant trois ans auprès de Gaël Aubrit (formation Improvie en improvisation vocale), puis en pédagogie de la technique vocale auprès d&apos;Emmanuelle Trinquesse, elle crée Donner de la Voix en 2016.
            </p>
            <p className="m-0 text-sm">
              Sa pédagogie tient en trois piliers : l&apos;écoute de ce qui existe déjà chez chaque personne, la bienveillance sans perdre l&apos;exigence, et l&apos;apprentissage par le jeu, porté.e par le plaisir plutôt que par l&apos;effort. Elle est engagée dans le mouvement Chant Pour Tous depuis 2019, dans le Cercle Enchanté ainsi que dans The Well, réseau international de la pratique vocale improvisée.
            </p>
            <Link href="/about" className="btn-rdv self-start mt-2">Découvrir le parcours complet de Jessalynn</Link>
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28">
          <h2 className="section-title-bentos">À qui s&apos;adresse cette formation</h2>
          <p className="text-white/80 text-sm mb-4">Elle s&apos;adresse à toutes les personnes qui aiment chanter, qui ont déjà pratiqué au moins une fois la co-improvisation ou le circlesong, et qui cherchent à gagner en confiance et en technique au sein d&apos;un groupe fixe.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {prerequis.map((item, i) => (
              <div key={item.text} className={`glass-panel-rose ${prerequisTints[i % prerequisTints.length]} p-6 rounded-2xl flex flex-col items-center gap-2 text-center relative overflow-hidden bento-content-glass`}>
                <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                <p className="m-0 text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28">
          <h2 className="section-title-bentos">Ce que vous retirerez de cette formation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficesFormation.map((item, i) => (
              <div key={item.text} className={`glass-panel-rose ${beneficesTints[i % beneficesTints.length]} p-6 rounded-2xl flex flex-col items-center gap-2 text-center relative overflow-hidden bento-content-glass`}>
                <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                <p className="m-0 text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28" id="calendrier">
          <h2 className="section-title-bentos">Le calendrier</h2>
          <p className="text-white/80 text-sm mb-4">Toutes les dates, fixées à l&apos;avance, pour s&apos;organiser dès l&apos;inscription.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
            {legend.map((l) => (
              <span key={l.type} className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wide">
                <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: dotColors[l.type] }} />
                {l.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarMonths.map(([year, monthIdx, label]) => {
              const cells = buildMonthCells(year, monthIdx)
              return (
                <div key={label} className="glass-panel-rose bento-tint-mix rounded-2xl p-4 bento-content-glass">
                  <h3 className="m-0 mb-3 text-sm font-bold uppercase tracking-wide text-center">{label}</h3>
                  <div className="grid grid-cols-7 gap-y-1 mb-1">
                    {dayLabels.map((d, i) => (
                      <span key={i} className="text-center text-[9px] font-bold uppercase text-white/50">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {cells.map((cell, i) => (
                      <div key={i} className="aspect-square flex items-center justify-center text-[11px] font-bold">
                        {cell.day && (
                          cell.type ? (
                            <span
                              className="flex items-center justify-center size-6 rounded-md text-white"
                              style={{ backgroundColor: dotColors[cell.type] }}
                            >
                              {cell.day}
                            </span>
                          ) : (
                            <span className="text-white/70">{cell.day}</span>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28" id="infos-pratiques">
          <h2 className="section-title-bentos">Infos pratiques</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {infosPratiques.map((group) => {
              const Icon = group.icon
              return (
                <div key={group.title} className={`glass-panel-rose ${group.tint} p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden bento-content-glass`}>
                  <div className="flex items-center gap-3">
                    <Icon className="bento-icon !w-8 !h-8 shrink-0" />
                    <h3 className="m-0 text-base">{group.title}</h3>
                  </div>
                  <dl className="flex flex-col divide-y divide-white/10 m-0">
                    {group.items.map((item) => (
                      <div key={item.label} className="flex justify-between items-baseline gap-4 py-2.5">
                        <dt className="text-white/70 text-xs font-semibold m-0">{item.label}</dt>
                        <dd className="text-white font-bold text-sm text-right m-0">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-12 md:mb-16 scroll-mt-28" id="candidater">
          <h2 className="section-title-bentos">Comment candidater</h2>
          <p className="text-white/80 text-sm mb-4">Cette formation se fait sur candidature. L&apos;objectif : vérifier ensemble les prérequis, pour que le groupe puisse progresser dans les meilleures conditions, pour vous comme pour les autres.</p>
          <div className="glass-panel-rose bento-tint-mix rounded-2xl p-6 md:p-8 bento-content-glass flex flex-col gap-6">
            <ul className="flex flex-col divide-y divide-white/10 m-0 p-0 list-none">
              {candidature.map((item) => (
                <li key={item.step} className="flex items-start gap-4 py-3 text-sm">
                  <span className="flex items-center justify-center shrink-0 size-7 rounded-full bg-white/15 font-bold text-sm">{item.step}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="https://tally.so/r/2EydxM"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rdv inline-flex items-center gap-2"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Remplir le formulaire de candidature
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-xs uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <Mail className="size-4" aria-hidden="true" />
                Une question ? Me contacter
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-4 scroll-mt-28">
          <h2 className="section-title-bentos">Avis</h2>
          <div className="sk-ww-google-reviews" data-embed-id="25582122" suppressHydrationWarning />
          <Script src="https://widgets.sociablekit.com/google-reviews/widget.js" strategy="lazyOnload" />
        </section>
      </div>

      <SocialBar />
    </main>
  )
}
