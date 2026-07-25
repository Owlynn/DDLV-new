'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [openAbout, setOpenAbout] = useState(false)
  const [openCoursAteliers, setOpenCoursAteliers] = useState(false)
  const aboutRef = useRef<HTMLDivElement>(null)
  const coursAteliersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setOpenAbout(false)
      }
      if (coursAteliersRef.current && !coursAteliersRef.current.contains(e.target as Node)) {
        setOpenCoursAteliers(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeAll = () => { setOpen(false); setOpenAbout(false); setOpenCoursAteliers(false) }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pl-3 sm:pl-6 md:pl-8 pr-3 sm:pr-6 md:pr-4 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-16">
        <Link href="/" className="header-logo flex items-center shrink-0 max-w-[180px] md:max-w-[220px] mr-2" aria-label="Donner de la Voix - Accueil">
          <Image src="/assets/logo-ddlv.png" alt="Donner de la Voix" width={220} height={55} className="w-full h-auto object-contain" />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="header-nav-toggle lg:hidden size-12 rounded-xl glass-panel flex items-center justify-center text-white border-0 cursor-pointer hover:bg-white/20 transition-colors ml-auto"
          aria-expanded={open}
          aria-controls="header-nav"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span className="material-symbols-outlined text-3xl">{open ? 'close' : 'menu'}</span>
        </button>

        <div
          id="header-nav"
          className={`header-nav-panel flex-1 flex max-lg:flex-col justify-center min-w-0 max-lg:fixed max-lg:inset-0 max-lg:top-0 max-lg:pt-24 max-lg:pb-8 max-lg:px-4 max-lg:z-40 max-lg:overflow-y-auto max-lg:bg-white/10 max-lg:backdrop-blur-[60px] max-lg:border-b max-lg:border-white/20 ${open ? 'nav-open' : 'max-lg:hidden'}`}
          aria-hidden={!open}
        >
          <nav className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-10 glass-panel-rose lg:px-6 lg:py-3 rounded-2xl w-full lg:w-fit shrink-0 p-5 lg:p-0" aria-label="Navigation principale">
            <Link className="nav-item text-white flex items-center py-4 px-4 lg:p-1 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent text-xl lg:text-sm" href="/" onClick={closeAll} aria-label="Accueil">
              <span className="material-symbols-outlined text-3xl lg:text-2xl mr-4 lg:mr-0">home</span>
              <span className="lg:hidden font-medium tracking-widest uppercase">Accueil</span>
            </Link>
            {/* Cours et ateliers avec sous-menu */}
            <div className="relative" ref={coursAteliersRef}>
              <button
                type="button"
                onClick={() => setOpenCoursAteliers(!openCoursAteliers)}
                className="nav-item text-white text-xl lg:text-sm font-medium transition-colors tracking-widest uppercase py-4 px-4 lg:p-0 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent w-full flex items-center justify-between lg:justify-start lg:gap-1"
              >
                <span>Cours et ateliers</span>
                <span className={`material-symbols-outlined text-base transition-transform duration-200 ${openCoursAteliers ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>
              </button>

              {/* Sous-menu mobile */}
              {openCoursAteliers && (
                <div className="lg:hidden nav-dropdown-panel rounded-xl p-2 flex flex-col gap-1 mt-1">
                  <Link href="/cours-chant" className="text-white/90 text-lg font-medium tracking-widest uppercase py-3 px-4 rounded-xl hover:bg-white/10 transition-colors" onClick={closeAll}>Cours de chant et technique vocale</Link>
                  <Link href="/ateliers" className="text-white/90 text-lg font-medium tracking-widest uppercase py-3 px-4 rounded-xl hover:bg-white/10 transition-colors" onClick={closeAll}>Stages &amp; ateliers</Link>
                  <Link href="/impro-vocale" className="text-white/90 text-lg font-medium tracking-widest uppercase py-3 px-4 rounded-xl hover:bg-white/10 transition-colors" onClick={closeAll}>Qu&apos;est-ce que l&apos;impro vocale</Link>
                </div>
              )}

              {/* Sous-menu desktop */}
              {openCoursAteliers && (
                <div className="hidden lg:flex flex-col absolute top-full left-1/2 -translate-x-1/2 mt-3 nav-dropdown-panel rounded-xl py-2 min-w-[260px] z-50">
                  <Link href="/cours-chant" className="px-5 py-3 text-white text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors" onClick={closeAll}>Cours de chant et technique vocale</Link>
                  <Link href="/ateliers" className="px-5 py-3 text-white text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors" onClick={closeAll}>Stages &amp; ateliers</Link>
                  <Link href="/impro-vocale" className="px-5 py-3 text-white text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors" onClick={closeAll}>Qu&apos;est-ce que l&apos;impro vocale</Link>
                </div>
              )}
            </div>
            <Link className="nav-item text-white text-xl lg:text-sm font-medium transition-colors tracking-widest uppercase py-4 px-4 lg:p-0 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent" href="/formation-focus" onClick={closeAll}>Formation Focus</Link>
            <Link className="nav-item text-white text-xl lg:text-sm font-medium transition-colors tracking-widest uppercase py-4 px-4 lg:p-0 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent" href="/offre-entreprise" onClick={closeAll}>Entreprise</Link>

            {/* À propos avec sous-menu */}
            <div className="relative" ref={aboutRef}>
              <button
                type="button"
                onClick={() => setOpenAbout(!openAbout)}
                className="nav-item text-white text-xl lg:text-sm font-medium transition-colors tracking-widest uppercase py-4 px-4 lg:p-0 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent w-full flex items-center justify-between lg:justify-start lg:gap-1"
              >
                <span>À propos</span>
                <span className={`material-symbols-outlined text-base transition-transform duration-200 ${openAbout ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>
              </button>

              {/* Sous-menu mobile */}
              {openAbout && (
                <div className="lg:hidden nav-dropdown-panel rounded-xl p-2 flex flex-col gap-1 mt-1">
                  <Link href="/about" className="text-white/90 text-lg font-medium tracking-widest uppercase py-3 px-4 rounded-xl hover:bg-white/10 transition-colors" onClick={closeAll}>La pédagogue</Link>
                  <Link href="/mentions-legales" className="text-white/90 text-lg font-medium tracking-widest uppercase py-3 px-4 rounded-xl hover:bg-white/10 transition-colors" onClick={closeAll}>Mentions légales</Link>
                </div>
              )}

              {/* Sous-menu desktop */}
              {openAbout && (
                <div className="hidden lg:flex flex-col absolute top-full left-1/2 -translate-x-1/2 mt-3 nav-dropdown-panel rounded-xl py-2 min-w-[200px] z-50">
                  <Link href="/about" className="px-5 py-3 text-white text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors" onClick={closeAll}>La pédagogue</Link>
                  <Link href="/mentions-legales" className="px-5 py-3 text-white text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors" onClick={closeAll}>Mentions légales</Link>
                </div>
              )}
            </div>

            <Link className="nav-item text-white text-xl lg:text-sm font-medium transition-colors tracking-widest uppercase py-4 px-4 lg:p-0 rounded-xl lg:rounded-none hover:bg-white/10 lg:hover:bg-transparent" href="/espace-eleve" onClick={closeAll}>Espace élève</Link>
          </nav>
          <Link
            href="/contact"
            onClick={closeAll}
            className="lg:hidden mt-auto w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest border border-[#cf3594]/70 bg-[#cf3594]/50 hover:bg-[#cf3594]/70 text-white transition-all shrink-0"
            aria-label="Me contacter"
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">mail</span>
            Me contacter
          </Link>
        </div>
      </div>
    </header>
  )
}
