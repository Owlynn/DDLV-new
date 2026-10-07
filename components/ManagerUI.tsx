'use client'

import { useEffect, useRef, useState } from 'react'
import type { Exercice } from '@/lib/suivi'

// Briques partagées des écrans de gestion (suivi des séances, exercices) : modale, champs, boutons, tableau.

/* ── Modale ───────────────────────────────────────────── */

// Modales ouvertes, de la plus ancienne à la plus récente : Échap ne ferme que celle du dessus.
const openModals: symbol[] = []

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const id = Symbol()
    openModals.push(id)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === id) onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      openModals.splice(openModals.indexOf(id), 1)
    }
  }, [])

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


/* ── Exercices et notions ─────────────────────────────── */

/** Détail d'un exercice (modale) : notions et objectifs en étiquettes, puis description. */
export function ExerciceDetail({ exercice, notions }: { exercice: Exercice; notions: string[] }) {
  if (!notions.length && !exercice.description?.trim()) {
    return <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Pas encore de détails pour cet exercice.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {notions.length > 0 && (
        <section>
          <SectionLabel>Notions et objectifs</SectionLabel>
          <NotionChips labels={notions} />
        </section>
      )}
      {exercice.description?.trim() && (
        <section>
          <SectionLabel>Description de l'exercice</SectionLabel>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', margin: 0 }}>{exercice.description}</p>
        </section>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.45rem' }}>{children}</div>
}

export function NotionChips({ labels, onRemove }: { labels: string[]; onRemove?: (index: number) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {labels.map((label, i) => (
        <span key={`${label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', padding: onRemove ? '0.2rem 0.3rem 0.2rem 0.65rem' : '0.2rem 0.65rem', borderRadius: 999, color: '#d9c6ff', border: '1px solid rgba(142,91,216,0.5)', background: 'rgba(142,91,216,0.15)' }}>
          {label}
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)} aria-label={`Retirer ${label}`} style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

/**
 * Choix de notions dans une liste, avec recherche. Si aucune notion ne correspond exactement,
 * propose de la créer (onCreate doit l'insérer en base et renvoyer la notion créée).
 */
export function NotionPicker({ notions, selected, onChange, onCreate }: {
  notions: { id: string; libelle: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
  onCreate: (libelle: string) => Promise<{ id: string; libelle: string } | null>
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Ferme la liste au clic en dehors
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const byId = new Map(notions.map(n => [n.id, n]))
  const q = query.trim().toLowerCase()
  const matches = notions.filter(n => !selected.includes(n.id) && (!q || n.libelle.toLowerCase().includes(q))).slice(0, 50)
  const exact = notions.some(n => n.libelle.toLowerCase() === q)

  function add(id: string) {
    onChange([...selected, id])
    setQuery('')
  }

  async function create() {
    const libelle = query.trim()
    if (!libelle) return
    setCreating(true)
    const created = await onCreate(libelle)
    setCreating(false)
    if (created) add(created.id)
  }

  return (
    <div ref={boxRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {selected.length > 0 && (
        <NotionChips labels={selected.map(id => byId.get(id)?.libelle ?? '?')} onRemove={i => onChange(selected.filter((_, j) => j !== i))} />
      )}
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (matches[0] && (exact || !q || matches[0].libelle.toLowerCase() === q)) add(matches[0].id)
              else if (q && !exact) create()
            }
            if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) }
          }}
          placeholder="Rechercher une notion ou un objectif…"
          style={{ ...input, width: '100%' }}
        />
        {open && (matches.length > 0 || (q && !exact)) && (
          <ul style={{ position: 'absolute', zIndex: 10, top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', margin: 0, padding: '0.3rem', listStyle: 'none', borderRadius: '0.6rem', background: '#1f0d35', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
            {matches.map(n => (
              <li key={n.id}>
                <button type="button" onClick={() => add(n.id)} className="hover:bg-white/10" style={pickerItem}>{n.libelle}</button>
              </li>
            ))}
            {q && !exact && (
              <li>
                <button type="button" onClick={create} disabled={creating} className="hover:bg-white/10" style={{ ...pickerItem, color: '#cf3594' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>add</span>
                  {creating ? 'Création…' : `Créer « ${query.trim()} »`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

const pickerItem: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.5rem 0.7rem', borderRadius: '0.45rem', border: 'none',
  background: 'transparent', color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
}
export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}

/** Modale de confirmation (remplace window.confirm) — destinée aux suppressions. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    await request.onConfirm()
    setBusy(false)
    onClose()
  }

  return (
    <Modal title={request.title} onClose={busy ? () => {} : onClose}>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', margin: 0 }}>{request.message}</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button type="button" onClick={onClose} disabled={busy} style={btnGhost} autoFocus>Annuler</button>
        <button type="button" onClick={confirm} disabled={busy} style={btnDanger}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
          {busy ? 'Suppression…' : request.confirmLabel ?? 'Supprimer'}
        </button>
      </div>
    </Modal>
  )
}

export const btnDanger: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.6rem 1.1rem', borderRadius: '0.75rem', border: '1px solid rgba(248,113,113,0.5)',
  background: 'rgba(248,113,113,0.15)', color: '#f87171',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

/** Dernière cellule d'une ligne de tableau cliquable : corbeille (si onDelete) + flèche d'ouverture. */
export function RowActions({ onDelete, deleteTitle = 'Supprimer' }: { onDelete?: () => void; deleteTitle?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.1rem' }}>
      {onDelete && (
        // stopPropagation : le clic / Entrée ne doit pas ouvrir la ligne
        <span onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          <IconButton icon="delete" title={deleteTitle} danger onClick={onDelete} />
        </span>
      )}
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>chevron_right</span>
    </span>
  )
}

/** Largeur de la colonne d'actions selon la présence du bouton de suppression. */
export const rowActionsWidth = (withDelete: boolean) => (withDelete ? '4.75rem' : '2.5rem')
