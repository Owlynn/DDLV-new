'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

type Page = 'dashboard' | 'blog'

interface Post {
  id: string
  title: string
  status: 'published' | 'draft'
  created_at: string
}

interface Stats {
  published: number
  drafts: number
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')
  const [stats, setStats] = useState<Stats>({ published: 0, drafts: 0 })
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/espace-eleve'); return }
      setUser(session.user)
      setAuthLoading(false)
      loadStats()
    })
  }, [router])

  async function loadStats() {
    try {
      const [pub, draft] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      ])
      setStats({ published: pub.count ?? 0, drafts: draft.count ?? 0 })
    } catch {}
  }

  async function loadPosts() {
    setPostsLoading(true)
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
      setPosts(data ?? [])
    } catch {}
    setPostsLoading(false)
  }

  function switchPage(p: Page) {
    setPage(p)
    if (p === 'blog') loadPosts()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/espace-eleve')
  }

  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'rgba(207,53,148,0.65)', animation: 'spin 0.9s linear infinite' }}>
          autorenew
        </span>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', fontFamily: "'Josefin Sans', sans-serif", color: '#fff' }}>
      {/* Gradient background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 55% 65% at 10% 15%, rgba(91,42,181,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 85%, rgba(207,53,148,0.13) 0%, transparent 55%)' }} />

      {/* ── Sidebar ── */}
      <aside style={{ width: 260, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'relative', zIndex: 1, background: 'linear-gradient(160deg, rgba(255,252,255,0.12) 0%, rgba(255,240,248,0.06) 50%, rgba(240,235,255,0.10) 100%)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.09)' }}>
        {/* Brand */}
        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#cf3594', lineHeight: 1 }}>DDLV</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginTop: '0.2rem' }}>Administration</div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
          {(['dashboard', 'blog'] as Page[]).map((p) => {
            const active = page === p
            return (
              <button
                key={p}
                onClick={() => switchPage(p)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: active ? 'rgba(207,53,148,0.12)' : 'transparent', boxShadow: active ? 'inset 0 0 0 1px rgba(207,53,148,0.25)' : 'none', color: active ? '#cf3594' : 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>
                  {p === 'dashboard' ? 'dashboard' : 'article'}
                </span>
                {p === 'dashboard' ? 'Dashboard' : 'Blog'}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.75rem 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem 0.75rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(91,42,181,0.6), rgba(207,53,148,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>logout</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ padding: '0.875rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', background: 'rgba(13,2,24,0.65)', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            {page === 'dashboard' ? 'Dashboard' : 'Blog'}
          </h1>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
          {page === 'dashboard' && <Dashboard stats={stats} onNewPost={() => switchPage('blog')} />}
          {page === 'blog' && <Blog posts={posts} loading={postsLoading} />}
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────── */

function Dashboard({ stats, onNewPost }: { stats: Stats; onNewPost: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Bonjour !</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          Bienvenue dans l'espace d'administration Donner de la Voix.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', maxWidth: 760, marginBottom: '2.5rem' }}>
        <StatCard label="Articles publiés" icon="article" value={stats.published} />
        <StatCard label="Brouillons" icon="edit_note" value={stats.drafts} />
        <StatCard label="Ateliers" icon="event" value="–" note="Via BilletWeb" />
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
          Accès rapides
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={onNewPost}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: '#cf3594', color: '#fff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 4px 14px rgba(207,53,148,0.4)', fontFamily: 'inherit' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
            Nouvel article
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', fontFamily: 'inherit' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>open_in_new</span>
            Voir le site
          </a>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, icon, value, note }: { label: string; icon: string; value: number | string; note?: string }) {
  return (
    <div style={{ borderRadius: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.9rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, color: '#fff' }}>{value}</div>
      {note && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', marginTop: '0.3rem' }}>{note}</div>}
    </div>
  )
}

/* ── Blog ──────────────────────────────────────────── */

function Blog({ posts, loading }: { posts: Post[]; loading: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Articles</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Gérez les articles du blog.</p>
        </div>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: '#cf3594', color: '#fff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 4px 14px rgba(207,53,148,0.4)', fontFamily: 'inherit' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Nouvel article
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', padding: '1rem 0' }}>Chargement…</p>
      ) : posts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.18)', marginBottom: '1rem' }}>article</span>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '0.3rem' }}>Aucun article pour le moment.</p>
          <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.75rem' }}>Créez votre premier article pour commencer.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {posts.map(post => <PostRow key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}

function PostRow({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const isPublished = post.status === 'published'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.15s' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>article</span>
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {post.title}
      </span>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 600, background: isPublished ? 'rgba(77,184,170,0.2)' : 'rgba(255,255,255,0.1)', color: isPublished ? '#4db8aa' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
        {isPublished ? 'Publié' : 'Brouillon'}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>chevron_right</span>
    </div>
  )
}
