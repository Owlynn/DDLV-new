'use client'

import { useEffect } from 'react'

// Briques partagées des écrans de gestion (suivi des séances, exercices) : modale, champs, boutons, tableau.

/* ── Modale ───────────────────────────────────────────── */

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,0,12,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '1.1rem', background: 'linear-gradient(160deg, #24103d 0%, #160829 100%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>{subtitle}</div>}
          </div>
          <IconButton icon="close" title="Fermer" onClick={onClose} />
        </div>
        <div style={{ padding: '1.25rem 1.5rem 1.5rem', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

export const th: React.CSSProperties = {
  padding: '0.8rem 1rem',
  fontSize: '0.65rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.35)',
}

export const td: React.CSSProperties = {
  padding: '0.85rem 1rem',
  fontSize: '0.85rem',
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // div plutôt que <label> : un label contenant plusieurs boutons activerait le premier au clic sur le texte
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      {children}
    </div>
  )
}

export function FilterPill({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.15)', background: active ? `${color}26` : 'transparent', color: active ? color : 'rgba(255,255,255,0.45)' }}>
      {children}
    </button>
  )
}

export function IconButton({ icon, title, onClick, danger, disabled }: { icon: string; title: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} disabled={disabled} style={{ display: 'inline-flex', padding: '0.3rem', border: 'none', background: 'transparent', borderRadius: '0.5rem', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.25 : 1, color: danger ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.5)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
    </button>
  )
}

export const input: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  borderRadius: '0.6rem',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  colorScheme: 'dark',
}

export const btnAccent: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.6rem 1.1rem', borderRadius: '0.75rem', border: 'none',
  background: 'linear-gradient(135deg, #5b2ab5, #cf3594)', color: '#fff',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

export const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.6rem 1.1rem', borderRadius: '0.75rem',
  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.75)',
  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
}
