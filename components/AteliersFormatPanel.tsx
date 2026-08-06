'use client'

import { useState } from 'react'
import Link from 'next/link'

type BentoItem =
  | { kind: 'format'; id: string; label: string; subtitle: string; badge: string; tint: string; size: string }
  | { kind: 'photo';  id: string; src: string;   alt: string;                                   size: string }

// Ordre pensé pour que chaque rangée = 4 colonnes exactement :
// Row 1 : AF(2) + Stage(1) + Immersif(1) = 4
// Row 2 : Chant(2) + Photo jessalynn-2(2) = 4
// Row 3 : Poésie(2) + Gestuelle(1) + Photo jessalynn-3(1) = 4
// Row 4 : Flashmob(2) + Coaching(1) + Photo atelier-4(1) = 4
// Row 5 : Chorale(2)
const ITEMS: BentoItem[] = [
  { kind: 'format', id: 'ateliers-focus',       label: 'Atelier Focus',           subtitle: 'Impro mensuelle, circlesongs.',               badge: 'Atelier',   tint: 'bento-tint-mix',          size: 'bento-f-2x1' },
  { kind: 'format', id: 'art-circle-songs',     label: 'Stage Journée · Circlesongs : les clés pour oser', subtitle: '6 juin 2025 · Toulouse.', badge: 'Stage', tint: 'bento-tint-primary', size: 'bento-f-1x1' },
  { kind: 'format', id: 'stage-circlesong',     label: 'Circlesong immersif',     subtitle: '5 jours d\'immersion.',                      badge: 'Stage',     tint: 'bento-tint-accent',       size: 'bento-f-1x1' },
  { kind: 'format', id: 'chant-pour-tous',      label: 'Chant pour tous',         subtitle: 'Découverte gratuite.',                       badge: 'Évènement', tint: 'bento-tint-teal',         size: 'bento-f-2x1' },
  { kind: 'photo',  id: 'photo-1', src: '/assets/atelier%20(6).jpg', alt: 'Grand groupe en improvisation vocale',                                          size: 'bento-f-2x1' },
  { kind: 'format', id: 'circlesong-poesie',    label: 'Circlesong poésie',       subtitle: 'Voix, mots & impro.',                        badge: 'Stage',     tint: 'bento-tint-primary-light',size: 'bento-f-2x1' },
  { kind: 'format', id: 'circlesong-gestuelle', label: 'Circlesong gestuelle',    subtitle: 'Direction & gestes.',                        badge: 'Stage',     tint: 'bento-tint-mix',          size: 'bento-f-1x1' },
  { kind: 'photo',  id: 'photo-2', src: '/assets/improvocale.png',  alt: 'Cercle d\'improvisation vocale vu du dessus',                                    size: 'bento-f-1x1' },
  { kind: 'format', id: 'flashmob-improvise',   label: 'Flashmob improvisé',      subtitle: 'Performance dans la rue.',                   badge: 'Évènement', tint: 'bento-tint-accent',       size: 'bento-f-2x1' },
  { kind: 'format', id: 'coaching-personnalise',label: 'Coaching personnalisé',   subtitle: 'Journée sur mesure.',                        badge: 'Stage',     tint: 'bento-tint-teal',         size: 'bento-f-1x1' },
  { kind: 'photo',  id: 'photo-3', src: '/assets/atelier%20(4).jpg', alt: 'Cercle vocal en plein air',                                                       size: 'bento-f-1x1' },
  { kind: 'format', id: 'chorale-improvisee',   label: 'La chorale improvisée',   subtitle: 'Direction de chœur improvisé & circlesongs.',badge: 'Atelier',   tint: 'bento-tint-primary',      size: 'bento-f-2x1' },
]

function Badge({ label }: { label: string }) {
  return <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-white/15 text-white">{label}</span>
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 my-4 border border-white/20 bg-white/10">
      <h3 className="mt-0 font-bold text-white mb-2">{title}</h3>
      {children}
    </div>
  )
}

const PANEL_CONTENT: Record<string, React.ReactNode> = {
  'ateliers-focus': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Tarif libre" /><Badge label="Circlesongs" /><Badge label="Petit groupe" /><Badge label="Toulouse" />
      </div>
      <p>Un atelier mensuel d&apos;improvisation vocale à Toulouse, tous les deuxièmes mardis du mois. Plongez dans l&apos;univers des circlesongs et de la co-improvisation dans une ambiance chaleureuse et ludique.</p>
      <p>L&apos;impro vocale mois après mois : chaque séance explore un ou deux aspects spécifiques du chant improvisé pour enrichir votre pratique et développer votre créativité vocale.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/atelier%20(9).jpg" alt="Atelier d'improvisation vocale à Toulouse" className="w-full rounded-xl object-cover my-3" style={{ maxHeight: '220px' }} loading="lazy" />
      <h3 className="font-bold text-white mt-4 mb-2">Au programme</h3>
      <p>À chaque atelier, nous explorons 1 à 2 thématiques parmi :</p>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li><strong>Musicalité</strong> : cohésion, harmonie, rythmique, polyphonie</li>
        <li><strong>Expression</strong> : présence, créativité, connexion au groupe</li>
        <li><strong>Jeu vocal</strong> : textures sonores, exploration de timbres</li>
        <li><strong>Écoute active</strong> : interaction, complémentarité</li>
        <li><strong>Solo et collectif</strong> : trouver sa place, oser, soutenir</li>
      </ul>
      <h3 className="font-bold text-white mt-4 mb-2">L&apos;esprit</h3>
      <ul className="list-none space-y-1 text-white/90">
        <li>✓ <strong>Cadre bienveillant</strong> – Exploration sans jugement</li>
        <li>✓ <strong>Approche ludique</strong> – Le plaisir avant la performance</li>
        <li>✓ <strong>Petit groupe</strong> – Max. 10 personnes</li>
      </ul>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Quand ?</dt> <dd className="inline">Tous les 2èmes mardis du mois</dd></div>
          <div><dt className="font-semibold inline">Durée</dt> <dd className="inline">3 heures (19h – 22h)</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Quartier Minimes, Toulouse</dd></div>
          <div><dt className="font-semibold inline">Groupe</dt> <dd className="inline">Max. 10 personnes</dd></div>
        </dl>
      </InfoBox>
      <InfoBox title="Tarif libre et conscient">
        <ul className="list-none space-y-1 text-white/90">
          <li><strong>15 €</strong> — Tarif minimum</li>
          <li><strong>20 € RECOMMANDÉ</strong> — Couvre les frais</li>
          <li><strong>25 €+</strong> — Soutien</li>
        </ul>
      </InfoBox>
      <p className="mt-4"><a href="https://www.billetweb.fr/pro/donnerdelavoix" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">Inscriptions BilletWeb</a></p>
    </>
  ),
  'art-circle-songs': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Stage journée" /><Badge label="Circlesongs" /><Badge label="Toulouse" />
      </div>
      <p>La circlesong, c&apos;est simple en théorie : une personne guide, les autres suivent, et la musique naît de rien. En pratique, on hésite. Cette journée nous invite à démystifier tout ça. On pratique, on expérimente, on rate sans drama, et on recommence.</p>
      <h3 className="font-bold text-white mt-4 mb-2">Objectifs</h3>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li>Créer des circlesongs de A à Z</li>
        <li>Développer votre assurance et créativité</li>
        <li>Explorer les gestes de direction (vocal painting)</li>
        <li>Se faire plaisir !</li>
      </ul>
      <p className="mt-3">Pas besoin d&apos;avoir chanté en groupe avant. Juste l&apos;envie d&apos;essayer.</p>
      <InfoBox title="Infos pratiques">
        <p className="text-white/90">📅 Vendredi 6 juin · 9h30 à 18h<br/>📍 Toulouse (lieu communiqué à l&apos;inscription)<br/>👥 8 personnes maximum<br/>🎟️ Tarif libre · à partir de 50€</p>
      </InfoBox>
      <p><a href="https://www.billetweb.fr/stage-journee-improvisation-vocale-et-circlesongs" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">Inscriptions ici</a></p>
    </>
  ),
  'stage-circlesong': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Circlesongs" /><Badge label="Stage 5 jours" /><Badge label="Toulouse" />
      </div>
      <p>5 jours pour explorer l&apos;art de l&apos;improvisation vocale collective. Le circlesong est une pratique d&apos;improvisation vocale collective où les participants créent ensemble une musique spontanée guidée par un chef de chœur improvisé.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/atelier%20(7).jpg" alt="Participants du stage circlesong immersif à Toulouse" className="w-full rounded-xl object-cover my-3" style={{ maxHeight: '220px' }} loading="lazy" />
      <h3 className="font-bold text-white mt-4 mb-2">Objectifs</h3>
      <p className="text-white/90">Gagner en confiance · Solidifier sa pratique · Lâcher prise · Développer sa créativité</p>
      <h3 className="font-bold text-white mt-4 mb-2">Programme</h3>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li><strong>Jour 1</strong> – Les bases du Circlesong</li>
        <li><strong>Jour 2</strong> – Approfondir les bases</li>
        <li><strong>Jour 3</strong> – Les débuts et les fins</li>
        <li><strong>Jour 4</strong> – Structurer un circlesong</li>
        <li><strong>Jour 5</strong> – Représentation publique en soirée</li>
      </ul>
      <InfoBox title="Format & Durée">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Format</dt> <dd className="inline">5 jours consécutifs · 9h30–17h</dd></div>
          <div><dt className="font-semibold inline">Lieu</dt> <dd className="inline">Toulouse</dd></div>
          <div><dt className="font-semibold inline">Groupe</dt> <dd className="inline">12 personnes max.</dd></div>
          <div><dt className="font-semibold inline">Tarif</dt> <dd className="inline">320 € (paiement en plusieurs fois possible)</dd></div>
        </dl>
      </InfoBox>
      <p><Link href="/contact" className="text-[#cf3594] underline">Me contacter pour s&apos;inscrire</Link></p>
    </>
  ),
  'chant-pour-tous': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Gratuit" /><Badge label="Circlesongs" /><Badge label="Tous niveaux" /><Badge label="Toulouse" />
      </div>
      <p>Chant pour tous est un atelier gratuit d&apos;improvisation vocale à Toulouse, ouvert à toutes et tous. Une belle occasion de découvrir l&apos;impro vocale et les circlesongs dans un cadre accessible et bienveillant, sans aucun engagement financier.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/atelier%20(1).jpeg" alt="Atelier Chant pour tous à Toulouse" className="w-full rounded-xl object-cover my-3" style={{ maxHeight: '220px' }} loading="lazy" />
      <h3 className="font-bold text-white mt-4 mb-2">Ce que vous allez découvrir</h3>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li>Découvrir l&apos;improvisation vocale dans un cadre convivial</li>
        <li>Expérimenter votre voix dans un cadre collectif</li>
        <li>Créer des circlesongs envoûtants</li>
        <li>Rencontrer une communauté passionnée par la voix</li>
      </ul>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Durée</dt> <dd className="inline">Environ 2 heures</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Atelier des Chalets, 23 Rue Edouard Dulaurier, Toulouse</dd></div>
          <div><dt className="font-semibold inline">Tarif</dt> <dd className="inline font-bold text-[#4db8aa]">GRATUIT</dd></div>
          <div><dt className="font-semibold inline">Animation</dt> <dd className="inline">Jessalynn</dd></div>
        </dl>
      </InfoBox>
    </>
  ),
  'circlesong-poesie': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Tarif libre" /><Badge label="Circlesongs" /><Badge label="Poésie" /><Badge label="Toulouse" />
      </div>
      <p>Une journée immersive d&apos;improvisation vocale à Toulouse pour explorer la rencontre entre circlesongs, poésie et création spontanée. Jeux d&apos;écriture, poésie spontanée et créations vocales collectives se répondent pour relier voix, mots et imagination.</p>
      <h3 className="font-bold text-white mt-4 mb-2">Au programme</h3>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li>Jeux d&apos;écriture créative</li>
        <li>Poésie spontanée</li>
        <li>Circlesongs texturés – intégrer les mots aux créations vocales</li>
        <li>Co-improvisation verbale et vocale</li>
        <li>Créations collectives</li>
      </ul>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Format</dt> <dd className="inline">Journée · 9h30–19h (pause 1h30)</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Atelier des Chalets, Toulouse</dd></div>
          <div><dt className="font-semibold inline">Groupe</dt> <dd className="inline">Max. 8 personnes</dd></div>
        </dl>
      </InfoBox>
      <InfoBox title="Tarif libre et conscient">
        <ul className="list-none space-y-1 text-white/90">
          <li><strong>50 €</strong> — Minimum</li>
          <li><strong>70 € RECOMMANDÉ</strong> — Tarif viable</li>
          <li><strong>80 €+</strong> — Soutien</li>
        </ul>
      </InfoBox>
    </>
  ),
  'circlesong-gestuelle': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Circlesongs" /><Badge label="Formation" /><Badge label="Toulouse" />
      </div>
      <p>Un atelier d&apos;une journée pour celles et ceux qui pratiquent déjà l&apos;impro vocale et qui ont envie d&apos;aller plus loin dans le jeu collectif. Comment se comprendre sans parler ? Comment se coordonner, lancer une idée, transformer une impro ?</p>
      <p>Explorez une boîte à outils gestuelle au service des circle songs et de l&apos;impro vocale en groupe, inspiré du Rythme Signé et du Vocal Painting.</p>
      <p><strong>Co-animé par</strong> Jessalynn Choby (Donner de la Voix) et Marc Charton (Ghost Note).</p>
      <p className="text-white/80"><strong>Prérequis :</strong> Pratiquer déjà l&apos;impro vocale.</p>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Format</dt> <dd className="inline">Journée complète · 10h–19h</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Toulouse Minimes</dd></div>
          <div><dt className="font-semibold inline">Tarif</dt> <dd className="inline">40 €</dd></div>
        </dl>
      </InfoBox>
      <p><a href="https://www.billetweb.fr/circlesong-la-gestuelle" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">Inscriptions BilletWeb</a></p>
    </>
  ),
  'flashmob-improvise': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Gratuit" /><Badge label="Circlesongs" /><Badge label="Performance" /><Badge label="Tous niveaux" />
      </div>
      <p>Une expérience collective unique dans les rues de Toulouse : on chante ensemble sans partition, en chorale improvisée. Des chefs de chœur lancent des propositions vocales, le groupe les reprend et crée ainsi une musique spontanée. Pas besoin de savoir lire la musique.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/atelier%20(5).jpg" alt="Flashmob improvisé — cercle vocal en plein air" className="w-full rounded-xl object-cover my-3" style={{ maxHeight: '220px' }} loading="lazy" />
      <h3 className="font-bold text-white mt-4 mb-2">Programme de la journée</h3>
      <ul className="list-none space-y-2 text-white/90">
        <li><strong>Répétition</strong> — Échauffement vocal, découverte du principe</li>
        <li><strong>Déambulation</strong> — Créations vocales improvisées dans les rues de Toulouse</li>
        <li><strong>Verre collectif</strong> — Pour clore cette belle aventure</li>
      </ul>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Horaires</dt> <dd className="inline">10h à 14h</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Divers lieux dans Toulouse</dd></div>
          <div><dt className="font-semibold inline">Tarif</dt> <dd className="inline font-bold text-[#4db8aa]">GRATUIT</dd></div>
        </dl>
      </InfoBox>
      <p><a href="https://www.billetweb.fr/flashmob-improvise-chant-pour-tous" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">S&apos;inscrire sur BilletWeb</a></p>
    </>
  ),
  'coaching-personnalise': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Personnalisé" /><Badge label="Impro vocale" /><Badge label="Tous niveaux" />
      </div>
      <p>Une journée intensive à Toulouse pour approfondir un ou deux aspects précis de votre pratique du circlesong, autant en tant que conducteur·rice qu&apos;en tant que choriste.</p>
      <h3 className="font-bold text-white mt-4 mb-2">Comment ça marche ?</h3>
      <p className="text-white/90">À l&apos;inscription, vous indiquez un ou deux aspects à travailler (Direction, Clarté, Harmonie, Structure…). Vous aurez deux passages longs dans la journée et participez en choriste le reste du temps.</p>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Format</dt> <dd className="inline">Journée intensive · Petit groupe</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Atelier des Chalets, Toulouse</dd></div>
        </dl>
      </InfoBox>
      <InfoBox title="Tarif libre et conscient">
        <ul className="list-none space-y-1 text-white/90">
          <li><strong>50 €</strong> — Minimum</li>
          <li><strong>70 € RECOMMANDÉ</strong></li>
          <li><strong>80 €+</strong> — Soutien</li>
        </ul>
      </InfoBox>
      <p><a href="https://www.billetweb.fr/pro/donnerdelavoix" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">Inscriptions BilletWeb</a></p>
    </>
  ),
  'chorale-improvisee': (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge label="Circlesongs" /><Badge label="Direction" /><Badge label="Toulouse" />
      </div>
      <p>Un atelier de 3 heures pour pratiquer la direction de chœur improvisé et les circlesongs. Vous vous inscrivez soit en <strong>choriste</strong> (15 €), soit en <strong>chef de chœur</strong> (20 €). Chaque séance alterne démonstrations, explications et mises en pratique.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/atelier%20(8).jpg" alt="La chorale improvisée en cercle vocal" className="w-full rounded-xl object-cover my-3" style={{ maxHeight: '220px' }} loading="lazy" />
      <h3 className="font-bold text-white mt-4 mb-2">Pour qui ?</h3>
      <ul className="list-disc list-inside space-y-1 text-white/90">
        <li><strong>Choristes</strong> — Chanter en circlesong dans un cadre bienveillant</li>
        <li><strong>Chefs de chœur</strong> — Diriger un cercle vocal, s&apos;entraîner à la direction improvisée</li>
      </ul>
      <InfoBox title="Informations pratiques">
        <dl className="grid gap-1 text-white/90">
          <div><dt className="font-semibold inline">Durée</dt> <dd className="inline">3 heures</dd></div>
          <div><dt className="font-semibold inline">Où ?</dt> <dd className="inline">Toulouse</dd></div>
          <div><dt className="font-semibold inline">Chefs de chœur</dt> <dd className="inline">5 maximum</dd></div>
        </dl>
      </InfoBox>
      <InfoBox title="Tarifs">
        <ul className="list-none space-y-1 text-white/90">
          <li><strong>Choriste</strong> — 15 €</li>
          <li><strong>Chef de chœur</strong> — 20 €</li>
        </ul>
      </InfoBox>
      <p><a href="https://www.billetweb.fr/pro/donnerdelavoix" target="_blank" rel="noopener noreferrer" className="text-[#cf3594] underline">Inscriptions BilletWeb</a></p>
    </>
  ),
}

export default function AteliersFormatPanel() {
  const [open, setOpen] = useState<string | null>(null)
  const current = open ? (ITEMS.find(i => i.kind === 'format' && i.id === open) as Extract<BentoItem, { kind: 'format' }> | undefined) : undefined

  return (
    <>
      <div className="bento-formats-zone bento-formats-zone--content">
        {ITEMS.map(item =>
          item.kind === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={item.id} className={`${item.size} rounded-2xl overflow-hidden`}>
              <img src={item.src} alt={item.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item.id)}
              className={`${item.size} glass-panel-rose ${item.tint} group p-5 sm:p-6 rounded-2xl relative overflow-hidden text-left transition-all hover:-translate-y-1 cursor-pointer border-0`}
            >
              <span className="bento-type-badge absolute top-3 right-3 text-[10px] uppercase tracking-widest font-semibold text-white rounded-full px-2.5 py-1">
                {item.badge}
              </span>
              <div className="pr-14 sm:pr-16">
                <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">{item.label}</h3>
                <p className="text-sm text-white/90 leading-snug font-light">{item.subtitle}</p>
              </div>
            </button>
          )
        )}
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setOpen(null)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(13,2,24,0.97)', backdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(255,255,255,0.12)' }}
        role="dialog"
        aria-modal="true"
        aria-label={current?.label ?? 'Format d\'atelier'}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10" style={{ background: 'rgba(13,2,24,0.9)' }}>
          {current && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50">{current.badge}</p>
              <h2 className="text-lg font-bold text-white">{current.label}</h2>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="ml-auto size-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white border-0 cursor-pointer"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="px-6 py-6 text-white/90 space-y-3 [&_p]:leading-relaxed [&_p]:mb-2 [&_strong]:text-white">
          {open && PANEL_CONTENT[open]}
          <div className="flex gap-3 pt-4 flex-wrap">
            <a href="#prochains" onClick={() => setOpen(null)} className="btn-rdv">Voir les dates</a>
            <Link href="/contact" onClick={() => setOpen(null)} className="btn-rdv">Une question ?</Link>
          </div>
        </div>
      </div>
    </>
  )
}
