'use client'

import Link from 'next/link'
import { useStudent } from '@/components/eleve/StudentContext'
import { STUDENT_PAGES, canAccess, entryHref } from '@/lib/student-pages'

export default function EleveHomePage() {
  const { tags } = useStudent()
  const pages = STUDENT_PAGES.filter(p => p.href !== '/eleve' && canAccess(p, tags))

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Bonjour !</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Bienvenue dans votre espace élève Donner de la Voix.</p>
      </div>

      {pages.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', maxWidth: 520 }}>
          Votre espace est encore vide : les contenus de vos cours et formations apparaîtront ici dès votre inscription.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', maxWidth: 760 }}>
          {pages.map(p => (
            <Link key={p.label} href={entryHref(p)!} style={{ borderRadius: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', color: '#fff', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#cf3594' }}>{p.icon}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{p.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
