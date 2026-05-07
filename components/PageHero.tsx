import Image from 'next/image'
import Link from 'next/link'

interface HeroLink {
  href: string
  label: string
  isCta?: boolean
}

interface PageHeroProps {
  title: React.ReactNode
  subtitle: React.ReactNode
  links?: HeroLink[]
}

export default function PageHero({ title, subtitle, links }: PageHeroProps) {
  return (
    <section className="hero-overlay relative min-h-screen flex items-center pt-20 sm:pt-24 pb-12 md:pb-12" aria-label="Hero">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
        <div className="flex flex-col items-start gap-6 sm:gap-10">
          <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5.8rem] lg:text-[7rem] font-bold tracking-tight text-white leading-tight">
            {title}
          </h1>
          {links && links.length > 0 && (
            <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" aria-label="Sommaire">
              {links.map((link) =>
                link.isCta ? (
                  <Link key={link.href} href={link.href} className="btn-rdv w-full sm:w-auto text-center">
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-widest border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          )}
        </div>
        <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-[36.4rem] md:max-w-[31.2rem]">
          {subtitle}
        </p>
      </div>
      <div className="hero-logo-wrap">
        <Link href="/" className="flex items-center justify-center w-full max-w-[min(100vw,560px)] px-2 sm:px-4" aria-label="Donner de la Voix - Accueil">
          <Image src="/assets/logo-ddlv.png" alt="Donner de la Voix - Voix & créativité" width={560} height={140} />
        </Link>
      </div>
    </section>
  )
}
