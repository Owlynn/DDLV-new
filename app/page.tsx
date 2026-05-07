'use client'

import { useEffect, useRef } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SocialBar from '@/components/SocialBar'
import PhotoBubblesLayer from '@/components/PhotoBubblesLayer'

const phrases = [
  { html: '<span class="hero-line-1"><span class="text-white">Les</span></span><span class="hero-line-2"><span class="hero-gradient-word hero-rotating-slide--smaller">Circlesongs</span></span>', smaller: true },
  { html: '<span class="hero-line-1"><span class="hero-gradient-word">Chorale</span></span><span class="hero-line-2">improvisée</span>', smaller: false },
  { html: '<span class="hero-line-1"><span class="hero-gradient-word">Impro</span></span><span class="hero-line-2">vocale</span>', smaller: false },
  { html: '<span class="hero-line-1">Cours de</span><span class="hero-line-2"><span class="hero-gradient-word">chant</span></span>', smaller: false },
  { html: '<span class="hero-line-1"><span class="hero-gradient-word">Coaching</span></span><span class="hero-line-2">vocal</span>', smaller: false },
  { html: '<span class="hero-line-1"><span class="hero-gradient-word">Stages</span> &</span><span class="hero-line-2">ateliers</span>', smaller: false },
  { html: '<span class="hero-line-1">Voix &</span><span class="hero-line-2"><span class="hero-gradient-word">créativité</span></span>', smaller: false },
]

export default function HomePage() {
  const slide1Ref = useRef<HTMLSpanElement>(null)
  const slide2Ref = useRef<HTMLSpanElement>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    const s1 = slide1Ref.current
    const s2 = slide2Ref.current
    if (!s1 || !s2) return

    s1.innerHTML = phrases[0].html
    s2.innerHTML = phrases[1].html
    s1.classList.add('slide-in')
    s2.classList.add('slide-wait')

    const duration = 420
    const interval = setInterval(() => {
      const prevIndex = indexRef.current
      indexRef.current = (indexRef.current + 1) % phrases.length
      const nextIndex = (indexRef.current + 1) % phrases.length

      const outSlide = prevIndex % 2 === 0 ? s1 : s2
      const inSlide = prevIndex % 2 === 0 ? s2 : s1

      inSlide.innerHTML = phrases[indexRef.current].html
      inSlide.classList.remove('slide-in', 'slide-wait')
      inSlide.classList.add('slide-wait')

      outSlide.classList.remove('slide-wait', 'slide-in')
      outSlide.classList.add('slide-in')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          outSlide.classList.remove('slide-in')
          outSlide.classList.add('slide-out')
        })
      })

      setTimeout(() => {
        outSlide.classList.add('no-transition')
        outSlide.classList.remove('slide-out')
        outSlide.classList.add('slide-wait')
        outSlide.innerHTML = phrases[nextIndex].html
        outSlide.offsetHeight
        outSlide.classList.remove('no-transition')

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inSlide.classList.remove('slide-wait')
            inSlide.classList.add('slide-in')
          })
        })
      }, duration)
    }, 3600)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
    <PhotoBubblesLayer />
    <main className="flex-1 min-h-0 flex flex-col pl-3 sm:pl-6 md:pl-8 pr-3 sm:pr-6 md:pr-4 lg:pr-4 py-6 sm:py-10 overflow-hidden relative z-10">
      <style>{`
        .hero-rotating-track { overflow: hidden; height: 14rem; min-height: 14rem; }
        @media (max-width: 639px) { .hero-rotating-track { height: 11rem; min-height: 11rem; } }
        @media (min-width: 640px) { .hero-rotating-track { height: 17rem; min-height: 17rem; } }
        @media (min-width: 768px) { .hero-rotating-track { height: 20rem; min-height: 20rem; } }
        @media (min-width: 1024px) { .hero-rotating-track { height: 24rem; min-height: 24rem; } }
        @media (max-width: 1023px) { .hero-rotating-wrap { width: 90vw; max-width: 90vw; box-sizing: border-box; padding: 0 0.5rem; } }
        @media (min-width: 1024px) { .hero-rotating-wrap { max-width: 42rem; } }
        .hero-rotating-title { font-size: clamp(3.75rem, 18vw, 6.5rem); }
        @media (min-width: 640px) { .hero-rotating-title { font-size: clamp(4.5rem, 15vw, 8rem); } }
        @media (min-width: 768px) { .hero-rotating-title { font-size: clamp(5.5rem, 12vw, 9rem); } }
        @media (min-width: 1024px) { .hero-rotating-title { font-size: clamp(4.5rem, 6vw, 6.5rem); } }
        @media (min-width: 1280px) { .hero-rotating-title { font-size: clamp(5.5rem, 6vw, 8.25rem); } }
        .hero-rotating-slide {
          transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1), top 0.42s cubic-bezier(0.4, 0, 0.2, 1), filter 0.42s ease-out;
          will-change: transform, top;
          display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
          gap: 0; height: 100%; min-height: 100%;
        }
        @media (max-width: 1023px) { .hero-rotating-slide { align-items: center; text-align: center; } }
        .hero-line-1 { display: block; white-space: nowrap; }
        @media (max-width: 1023px) { .hero-line-1 { white-space: normal; } }
        .hero-line-2 { display: block; margin-top: 0.12em; }
        .hero-rotating-slide.slide-out { transform: translateY(-100%); filter: blur(8px); z-index: 1; }
        .hero-rotating-slide.slide-in { top: 0; transform: translateY(0); z-index: 2; }
        .hero-rotating-slide.slide-wait { top: 100%; transform: translateY(1.5rem); z-index: 0; }
        .hero-rotating-slide.no-transition { transition: none; }
        .hero-rotating-slide--smaller { font-size: 0.88em; }
        .bento-column-pull { width: 100%; min-height: 0; display: flex; align-items: center; justify-content: flex-start; padding: 2rem 0; }
        .bento-zone { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; column-gap: 1.25rem; row-gap: 0.6rem; width: 100%; max-width: 416px; min-height: 0; box-sizing: border-box; overflow: visible; }
        .bento-hex-cell { min-height: 0; display: flex; align-items: center; justify-content: center; }
        .bento-hex-cell:nth-child(3), .bento-hex-cell:nth-child(4) { transform: translateX(35%); }
        .bento-drift { width: 100%; height: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; }
        .bento-hex-cell .bento-drift { animation: bento-bubble-float 14s ease-in-out infinite; }
        .bento-hex-cell:nth-child(2) .bento-drift { animation: bento-bubble-float-2 16s ease-in-out infinite -1s; }
        .bento-hex-cell:nth-child(3) .bento-drift { animation: bento-bubble-float-3 13s ease-in-out infinite -2.5s; }
        .bento-hex-cell:nth-child(4) .bento-drift { animation: bento-bubble-float-4 18s ease-in-out infinite -4s; }
        .bento-hex-cell .bento-small { display: block; position: relative; width: 100%; padding-bottom: 100%; height: 0; border-radius: 50%; transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.4s ease; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.28), inset 0 0 2px 1px rgba(255,250,252,0.2), 0 0 15px rgba(255,245,250,0.04); }
        .bento-hex-cell .bento-small:hover, .bento-hex-cell .bento-small:focus-visible { transform: translateY(-6px) scale(1.08); box-shadow: 0 12px 40px rgba(0,0,0,0.35), inset 0 0 2px 1px rgba(255,250,252,0.25), 0 0 28px rgba(207,53,148,0.2); border-color: rgba(255,240,245,0.45); }
        .bento-hex-cell .bento-small .bento-hex-inner { position: absolute; inset: 0; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; align-items: center; justify-content: center; text-align: center; }
        @keyframes bento-bubble-float { 0%, 100% { transform: translate(0,0) scale(1); } 25% { transform: translate(4%,-5%) scale(1.02); } 50% { transform: translate(-2%,6%) scale(0.99); } 75% { transform: translate(3%,2%) scale(1.02); } }
        @keyframes bento-bubble-float-2 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-3%,-6%) scale(1.02); } 66% { transform: translate(5%,4%) scale(0.99); } }
        @keyframes bento-bubble-float-3 { 0%, 100% { transform: translate(0,0) scale(1); } 25% { transform: translate(-4%,-5%) scale(0.99); } 50% { transform: translate(2%,2%) scale(1.02); } 75% { transform: translate(-2%,6%) scale(1.01); } }
        @keyframes bento-bubble-float-4 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4%,-4%) scale(1.02); } }
        @media (max-width: 1023px) { .bento-column-pull { display: none; } }
        .hero-bento-list { width: 90vw; max-width: 90vw; }
        @media (max-width: 1023px) {
          .hero-bento-list-inner { backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); background: rgba(255,250,252,0.08); border: 1px solid rgba(255,240,245,0.2); border-radius: 1rem; padding: 0.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.2), inset 0 0 2px 1px rgba(255,250,252,0.1); }
        }
      `}</style>

      <div className="flex-1 min-h-0 flex items-center justify-center max-h-[80vh]">
        <div className="hero-content-inner max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-0 items-center justify-items-center lg:justify-items-stretch min-h-0 px-2 sm:px-4">
          <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 items-center justify-center lg:items-start lg:justify-start lg:pl-8 lg:pr-4 xl:pl-12 xl:pr-8 min-w-0 w-full max-w-[100vw]">
            <div className="hero-rotating-track hero-rotating-wrap relative w-full text-center lg:text-left mx-auto lg:mx-0" aria-live="polite">
              <h1 className="hero-rotating-title font-bold leading-tight tracking-tighter text-white drop-shadow-2xl h-full min-h-[11rem] sm:min-h-[17rem] lg:min-h-[20rem] xl:min-h-[24rem] relative block">
                <span ref={slide1Ref} className="hero-rotating-slide absolute left-0 right-0 top-0" />
                <span ref={slide2Ref} className="hero-rotating-slide absolute left-0 right-0 top-0" />
              </h1>
            </div>

            <nav className="lg:hidden w-full hero-bento-list mt-2 sm:mt-6" aria-label="Navigation offres">
              <ul className="hero-bento-list-inner flex flex-col gap-2 sm:gap-3 list-none p-0 m-0">
                {[
                  { href: '/impro-vocale', icon: 'lyrics', label: "L'impro vocale" },
                  { href: '/ateliers', icon: 'calendar_month', label: 'Stages & Ateliers' },
                  { href: '/cours-chant', icon: 'mic_external_on', label: 'Cours de chant' },
                  { href: '/offre-entreprise', icon: 'corporate_fare', label: 'Offre entreprise' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hero-bento-list-item glass-panel-rose flex items-center gap-3 sm:gap-4 w-full rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-white no-underline transition-all hover:bg-white/15 border border-white/20">
                      <span className="size-10 sm:size-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl sm:text-3xl">{item.icon}</span>
                      </span>
                      <span className="flex flex-col text-left min-w-0">
                        <span className="font-bold text-sm sm:text-base uppercase tracking-tight">{item.label}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="hidden lg:block lg:col-span-1 min-w-0 relative overflow-visible">
            <div className="bento-column-pull">
              <div className="bento-zone">
                {[
                  { href: '/impro-vocale', icon: 'lyrics', label: "L'impro vocale", tint: 'bento-tint-mix' },
                  { href: '/ateliers', icon: 'calendar_month', label: 'Stages & Ateliers', tint: 'bento-tint-primary' },
                  { href: '/cours-chant', icon: 'mic_external_on', label: 'Cours de chant', tint: 'bento-tint-primary-light' },
                  { href: '/offre-entreprise', icon: 'corporate_fare', label: 'Offre entreprise', tint: 'bento-tint-accent' },
                ].map((item) => (
                  <div key={item.href} className="bento-hex-cell">
                    <div className="bento-drift">
                      <Link href={item.href} className={`bento-small glass-panel-rose ${item.tint} group relative overflow-hidden`}>
                        <span className="bento-hex-inner">
                          <span className="size-9 rounded-lg bg-white/5 inline-flex items-center justify-center text-white border border-white/20 group-hover:bg-primary/30 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          </span>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</h3>
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-logo-wrap">
        <Link href="/" className="flex items-center justify-center w-full max-w-[min(100vw,560px)] px-2 sm:px-4" aria-label="Donner de la Voix - Accueil">
          <Image src="/assets/logo-ddlv.png" alt="Donner de la Voix - Voix & créativité" width={360} height={90} />
        </Link>
      </div>

      <SocialBar />
    </main>
    </>
  )
}
