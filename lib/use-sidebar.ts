'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ddlv-sidebar-masquee'
const DOCKED = '(min-width: 768px)' // breakpoint md de Tailwind : la sidebar est fixée à gauche

/**
 * Sidebar de /admin et /eleve : tiroir sur mobile (`open`), masquable à partir de la tablette (`hidden`, mémorisé
 * dans le navigateur). `toggle` agit sur l'un ou l'autre selon la largeur d'écran.
 */
export function useSidebar() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try { setHidden(localStorage.getItem(STORAGE_KEY) === '1') } catch {}
  }, [])

  function toggle() {
    if (!window.matchMedia(DOCKED).matches) { setOpen(o => !o); return }
    const next = !hidden
    setHidden(next)
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch {}
  }

  return { open, setOpen, hidden, toggle }
}
