'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import PostEditor, { type Post } from '@/components/admin/PostEditor'
import type { User } from '@supabase/supabase-js'
import { STUDENT_TAGS, type StudentTagKey } from '@/lib/student-tags'

type View = 'dashboard' | 'blog' | 'editor' | 'students' | 'formation-focus'

interface Stats { published: number; drafts: number }

interface Student {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  confirmed_at: string | null
  tags: StudentTagKey[]
}

interface CandidatureAnswer {
  label: string
  value: string
}

interface Candidature {
  id: string
  submittedAt: string
  isCompleted: boolean
  answers: CandidatureAnswer[]
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [view, setView] = useState<View>('dashboard')
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const [stats, setStats] = useState<Stats>({ published: 0, drafts: 0 })
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')

  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [candidaturesLoading, setCandidaturesLoading] = useState(false)
  const [candidaturesError, setCandidaturesError] = useState('')

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/espace-eleve'); return }
      setUser(session.user)
      setAuthLoading(false)
      loadStats()
    })
  }, [router])

  /* ── Data ── */
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
        .select('id, title, slug, content, status, created_at')
        .order('created_at', { ascending: false })
      setPosts(data ?? [])
    } catch {}
    setPostsLoading(false)
  }

  async function deletePost(id: string) {
    if (!window.confirm('Supprimer cet article ?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(p => p.filter(post => post.id !== id))
    loadStats()
  }

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession()
    return { Authorization: `Bearer ${session?.access_token ?? ''}` }
  }

  async function loadStudents() {
    setStudentsLoading(true)
    setStudentsError('')
    try {
      const [res, tagsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: await authHeader() }),
        supabase.from('student_tags').select('user_id, tags'),
      ])
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
      const tagMap = new Map((tagsRes.data ?? []).map(r => [r.user_id as string, (r.tags ?? []) as StudentTagKey[]]))
      setStudents((body.users ?? []).map((u: Omit<Student, 'tags'>) => ({ ...u, tags: tagMap.get(u.id) ?? [] })))
    } catch (e) {
      setStudentsError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
    setStudentsLoading(false)
  }

  async function toggleStudentTag(studentId: string, tagKey: StudentTagKey) {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    const newTags = student.tags.includes(tagKey)
      ? student.tags.filter(t => t !== tagKey)
      : [...student.tags, tagKey]
    setStudents(s => s.map(st => st.id === studentId ? { ...st, tags: newTags } : st))
    await supabase.from('student_tags').upsert({ user_id: studentId, tags: newTags, updated_at: new Date().toISOString() })
  }

  async function inviteStudent(email: string) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ email }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
    loadStudents()
  }

  async function deleteStudent(id: string) {
    if (!window.confirm('Révoquer l\'accès de cet élève ?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: await authHeader() })
    if (res.ok) setStudents(s => s.filter(st => st.id !== id))
  }

  async function loadCandidatures() {
    setCandidaturesLoading(true)
    setCandidaturesError('')
    try {
      const res = await fetch('/api/admin/formation-focus-candidatures', { headers: await authHeader() })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Erreur inconnue')
      setCandidatures(body.submissions ?? [])
    } catch (e) {
      setCandidaturesError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
    setCandidaturesLoading(false)
  }

  /* ── Navigation ── */
  function goToBlog() {
    setView('blog')
    loadPosts()
  }

  function goToStudents() {
    setView('students')
    loadStudents()
  }

  function goToCandidatures() {
    setView('formation-focus')
    loadCandidatures()
  }

  function openEditor(post: Post | null) {
    setEditingPost(post)
    setView('editor')
  }

  function onSaved() {
    goToBlog()
    loadStats()
  }

  /* ── Sidebar nav ── */
  function handleNav(target: 'dashboard' | 'blog' | 'students' | 'formation-focus') {
    if (target === 'blog') { goToBlog(); return }
    if (target === 'students') { goToStudents(); return }
    if (target === 'formation-focus') { goToCandidatures(); return }
    setView('dashboard')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/espace-eleve')
  }

  const sidebarActive = view === 'editor' ? 'blog' : view

  /* ── Topbar title ── */
  const topbarTitle =
    view === 'dashboard' ? 'Dashboard'
    : view === 'blog' ? 'Blog'
    : view === 'students' ? 'Élèves'
    : view === 'formation-focus' ? 'Candidatures Formation Focus'
    : editingPost?.id ? "Modifier l'article"
    : 'Nouvel article'

  if (authLoading) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'rgba(207,53,148,0.65)', animation: 'spin 0.9s linear infinite' }}>autorenew</span>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0218', display: 'flex', fontFamily: "'Josefin Sans', sans-serif", color: '#fff' }}>
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 55% 65% at 10% 15%, rgba(91,42,181,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 85%, rgba(207,53,148,0.13) 0%, transparent 55%)' }} />

      {/* ── Sidebar ── */}
      <aside style={{ width: 260, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'relative', zIndex: 1, background: 'linear-gradient(160deg, rgba(255,252,255,0.12) 0%, rgba(255,240,248,0.06) 50%, rgba(240,235,255,0.10) 100%)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.09)' }}>

        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#cf3594', lineHeight: 1 }}>DDLV</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginTop: '0.2rem' }}>Administration</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
          {(['dashboard', 'blog', 'students', 'formation-focus'] as const).map(p => {
            const active = sidebarActive === p
            const icon = p === 'dashboard' ? 'dashboard' : p === 'blog' ? 'article' : p === 'students' ? 'group' : 'assignment_turned_in'
            const label = p === 'dashboard' ? 'Dashboard' : p === 'blog' ? 'Blog' : p === 'students' ? 'Élèves' : 'Candidatures Formation Focus'
            return (
              <button key={p} onClick={() => handleNav(p)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: active ? 'rgba(207,53,148,0.12)' : 'transparent', boxShadow: active ? 'inset 0 0 0 1px rgba(207,53,148,0.25)' : 'none', color: active ? '#cf3594' : 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.75rem 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem 0.75rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(91,42,181,0.6), rgba(207,53,148,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>{user?.email}</span>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 19, flexShrink: 0 }}>logout</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '0.875rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', background: 'rgba(13,2,24,0.65)', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.9)', margin: 0 }}>{topbarTitle}</h1>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
          {view === 'dashboard' && (
            <Dashboard stats={stats} onNewPost={() => openEditor(null)} />
          )}
          {view === 'blog' && (
            <BlogList posts={posts} loading={postsLoading} onNew={() => openEditor(null)} onEdit={openEditor} onDelete={deletePost} />
          )}
          {view === 'students' && (
            <StudentsList students={students} loading={studentsLoading} error={studentsError} onInvite={inviteStudent} onDelete={deleteStudent} onToggleTag={toggleStudentTag} />
          )}
          {view === 'formation-focus' && (
            <CandidaturesList candidatures={candidatures} loading={candidaturesLoading} error={candidaturesError} onRefresh={loadCandidatures} />
          )}
          {view === 'editor' && (
            <PostEditor post={editingPost} onBack={goToBlog} onSaved={onSaved} />
          )}
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
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Bienvenue dans l'espace d'administration Donner de la Voix.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', maxWidth: 760, marginBottom: '2.5rem' }}>
        <StatCard label="Articles publiés" icon="article" value={stats.published} />
        <StatCard label="Brouillons" icon="edit_note" value={stats.drafts} />
        <StatCard label="Ateliers" icon="event" value="–" note="Via BilletWeb" />
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>Accès rapides</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={onNewPost} style={btnAccent}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
            Nouvel article
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" style={btnGhostLink}>
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

/* ── Blog list ─────────────────────────────────────── */

function BlogList({ posts, loading, onNew, onEdit, onDelete }: {
  posts: Post[]
  loading: boolean
  onNew: () => void
  onEdit: (post: Post) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Articles</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Gérez les articles du blog.</p>
        </div>
        <button onClick={onNew} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Nouvel article
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {posts.map(post => (
            <PostRow key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostRow({ post, onEdit, onDelete }: { post: Post; onEdit: (p: Post) => void; onDelete: (id: string) => void }) {
  const date = new Date(post.created_at!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const isPublished = post.status === 'published'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>article</span>
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 600, flexShrink: 0, background: isPublished ? 'rgba(77,184,170,0.2)' : 'rgba(255,255,255,0.1)', color: isPublished ? '#4db8aa' : 'rgba(255,255,255,0.4)' }}>
        {isPublished ? 'Publié' : 'Brouillon'}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <button onClick={() => onEdit(post)} title="Modifier" style={{ display: 'flex', padding: '0.3rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: '0.5rem', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
      </button>
      <button onClick={() => post.id && onDelete(post.id)} title="Supprimer" style={{ display: 'flex', padding: '0.3rem', border: 'none', background: 'transparent', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', borderRadius: '0.5rem', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
      </button>
    </div>
  )
}

/* ── Élèves ────────────────────────────────────────── */

function StudentsList({ students, loading, error, onInvite, onDelete, onToggleTag }: {
  students: Student[]
  loading: boolean
  error: string
  onInvite: (email: string) => Promise<void>
  onDelete: (id: string) => void
  onToggleTag: (studentId: string, tagKey: StudentTagKey) => void
}) {
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    if (!email.trim()) return
    setInviting(true)
    try {
      await onInvite(email.trim())
      setInviteSuccess(`Invitation envoyée à ${email.trim()}.`)
      setEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
    setInviting(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Élèves</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Invitez des élèves à créer leur compte. Ils ne peuvent pas s'inscrire seuls.</p>
      </div>

      <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', maxWidth: 520 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email de l'élève"
          required
          style={{ flex: 1, minWidth: 220, fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.75rem', color: '#fff', padding: '0.625rem 1rem', outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="submit" disabled={inviting} style={btnAccent}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>send</span>
          {inviting ? 'Envoi…' : 'Inviter'}
        </button>
      </form>
      {inviteError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{inviteError}</p>}
      {inviteSuccess && <p style={{ color: '#4db8aa', fontSize: '0.85rem', marginBottom: '1rem' }}>{inviteSuccess}</p>}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : error ? (
        <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>
      ) : students.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.18)', marginBottom: '1rem' }}>group</span>
          <p style={{ color: 'rgba(255,255,255,0.35)' }}>Aucun élève invité pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {students.map(s => (
            <StudentRow key={s.id} student={s} onDelete={onDelete} onToggleTag={onToggleTag} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentRow({ student, onDelete, onToggleTag }: {
  student: Student
  onDelete: (id: string) => void
  onToggleTag: (studentId: string, tagKey: StudentTagKey) => void
}) {
  const date = new Date(student.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const active = !!student.confirmed_at
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>person</span>
      <span style={{ flex: 1, minWidth: 140, fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>

      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        {STUDENT_TAGS.map(tag => {
          const on = student.tags.includes(tag.key)
          return (
            <button
              key={tag.key}
              onClick={() => onToggleTag(student.id, tag.key)}
              title={on ? `Retirer l'étiquette ${tag.label}` : `Ajouter l'étiquette ${tag.label}`}
              style={{
                fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                padding: '0.2rem 0.55rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                border: on ? `1px solid ${tag.color}` : '1px solid rgba(255,255,255,0.15)',
                background: on ? `${tag.color}26` : 'transparent',
                color: on ? tag.color : 'rgba(255,255,255,0.3)',
                transition: 'all 0.15s',
              }}
            >
              {tag.label}
            </button>
          )
        })}
      </div>

      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 600, flexShrink: 0, background: active ? 'rgba(77,184,170,0.2)' : 'rgba(255,255,255,0.1)', color: active ? '#4db8aa' : 'rgba(255,255,255,0.4)' }}>
        {active ? 'Actif' : 'Invitation en attente'}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <button onClick={() => onDelete(student.id)} title="Révoquer l'accès" style={{ display: 'flex', padding: '0.3rem', border: 'none', background: 'transparent', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', borderRadius: '0.5rem', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
      </button>
    </div>
  )
}

/* ── Candidatures Formation Focus ──────────────────── */

function CandidaturesList({ candidatures, loading, error, onRefresh }: {
  candidatures: Candidature[]
  loading: boolean
  error: string
  onRefresh: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>Candidatures Formation Focus</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Réponses au formulaire de candidature (via Tally).</p>
        </div>
        <button onClick={onRefresh} style={btnGhostLink}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>refresh</span>
          Actualiser
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Chargement…</p>
      ) : error ? (
        <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>
      ) : candidatures.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.18)', marginBottom: '1rem' }}>assignment_turned_in</span>
          <p style={{ color: 'rgba(255,255,255,0.35)' }}>Aucune candidature reçue pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {candidatures.map(c => (
            <CandidatureRow key={c.id} candidature={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CandidatureRow({ candidature }: { candidature: Candidature }) {
  const [open, setOpen] = useState(false)
  const date = new Date(candidature.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const nameGuess = candidature.answers.find(a => /nom|pr[ée]nom|name/i.test(a.label))?.value

  return (
    <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '0.875rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>person</span>
        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nameGuess || `Candidature ${candidature.id.slice(0, 8)}`}
        </span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 600, flexShrink: 0, background: candidature.isCompleted ? 'rgba(77,184,170,0.2)' : 'rgba(255,255,255,0.1)', color: candidature.isCompleted ? '#4db8aa' : 'rgba(255,255,255,0.4)' }}>
          {candidature.isCompleted ? 'Complète' : 'Partielle'}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>expand_more</span>
      </button>

      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {candidature.answers.map((a, i) => (
            <div key={i} style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.3rem' }}>{a.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>{a.value || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.18)', marginBottom: '1rem' }}>article</span>
      <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '0.3rem' }}>Aucun article pour le moment.</p>
      <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.75rem' }}>Créez votre premier article pour commencer.</p>
    </div>
  )
}

/* ── Style constants ───────────────────────────────── */

const btnAccent: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
  border: 'none', background: '#cf3594', color: '#fff',
  fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(207,53,148,0.4)', fontFamily: 'inherit',
}

const btnGhostLink: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  textDecoration: 'none', fontFamily: 'inherit',
}
