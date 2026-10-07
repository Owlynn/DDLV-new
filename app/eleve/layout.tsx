'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { getMyTags } from '@/lib/student-access'
import { STUDENT_PAGES, canAccess, findStudentPage } from '@/lib/student-pages'
import { StudentContext, type StudentSession } from '@/components/eleve/StudentContext'

export default function EleveLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<StudentSession | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/espace-eleve'); return }
      setSession({ user: session.user, tags: await getMyTags(session.user.id) })
    })
  }, [router])

  const pages = session ? STUDENT_PAGES.filter(p => canAccess(p, session.tags)) : []
  const match = findStudentPage(pathname)
  const allowed = !match || (session && canAccess(match.page, session.tags))
  const title = match ? (match.parent ? `${match.parent.label} · ${match.page.label}` : match.page.label) : 'Espace élève'

  useEffect(() => {
    if (session && !allowed) router.replace('/eleve')
  }, [session, allowed, router])

  useEffect(() => setSidebarOpen(false), [pathname])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/espace-eleve')
  }

  if (!session || !allowed) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'rgba(207,53,148,0.65)', animation: 'spin 0.9s linear infinite' }}>autorenew</span>
    </div>
  )

  return (
    <StudentContext.Provider value={session}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', fontFamily: "'Josefin Sans', sans-serif", color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 55% 65% at 10% 15%, rgba(91,42,181,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 85%, rgba(207,53,148,0.13) 0%, transparent 55%)' }} />

        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} aria-hidden="true" className="fixed inset-0 z-40 bg-black/60 md:hidden" />
        )}

        <aside
          className={`fixed md:relative inset-y-0 md:inset-auto left-0 z-50 md:z-[1] w-[260px] max-w-[80vw] transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', background: 'linear-gradient(160deg, rgba(255,252,255,0.12) 0%, rgba(255,240,248,0.06) 50%, rgba(240,235,255,0.10) 100%)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div style={{ padding: '0.25rem 0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#cf3594', lineHeight: 1 }}>DDLV</div>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginTop: '0.2rem' }}>Espace élève</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu" className="md:hidden inline-flex p-1 border-0 bg-transparent text-white/50 cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
            {pages.map(p => {
              const active = pathname === p.href
              const inSection = active || !!p.children?.some(c => c.href === pathname)
              const headStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: active ? 'rgba(207,53,148,0.12)' : 'transparent', boxShadow: active ? 'inset 0 0 0 1px rgba(207,53,148,0.25)' : 'none', color: inSection ? '#cf3594' : 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em', textDecoration: 'none', transition: 'all 0.15s' }
              const head = (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>{p.icon}</span>
                  {p.label}
                </>
              )
              return (
                <div key={p.href ?? p.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  {p.href ? <Link href={p.href} style={headStyle}>{head}</Link> : <div style={headStyle}>{head}</div>}
                  {p.children && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginLeft: '1.6rem', paddingLeft: '0.6rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                      {p.children.map(c => {
                        const childActive = pathname === c.href
                        return (
                          <Link key={c.href} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.6rem', background: childActive ? 'rgba(207,53,148,0.12)' : 'transparent', boxShadow: childActive ? 'inset 0 0 0 1px rgba(207,53,148,0.25)' : 'none', color: childActive ? '#cf3594' : 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span>
                            {c.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {session.tags.includes('admin') && (
              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', marginTop: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>admin_panel_settings</span>
                Administration
              </Link>
            )}
          </nav>

          <div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem 0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(91,42,181,0.6), rgba(207,53,148,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>{session.user.email}</span>
            </div>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>logout</span>
              Déconnexion
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-3 px-4 py-3.5 md:px-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', background: 'rgba(13,2,24,0.65)', flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu" className="md:hidden inline-flex -ml-1 p-1 border-0 bg-transparent text-white/70 cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
            </button>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.9)', margin: 0 }}>{title}</h1>
          </div>
          <div className="p-4 md:p-8" style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </div>
        </div>
      </div>
    </StudentContext.Provider>
  )
}
