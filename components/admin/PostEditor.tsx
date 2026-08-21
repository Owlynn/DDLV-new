'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export interface Post {
  id?: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
  cover_image?: string | null
  published_at?: string | null
  created_at?: string
}

interface Props {
  post: Post | null
  onBack: () => void
  onSaved: () => void
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Convertit une date ISO (ou rien = maintenant) en valeur pour <input type="datetime-local"> (heure locale du navigateur) */
function toLocalInputValue(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PostEditor({ post, onBack, onSaved }: Props) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft')
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(post?.published_at))
  const [coverImage, setCoverImage] = useState<string | null>(post?.cover_image ?? null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugManual, setSlugManual] = useState(!!post?.id)
  const isScheduled = status === 'published' && new Date(publishedAt).getTime() > Date.now()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Commencez à écrire votre article…' }),
    ],
    content: post?.content ?? '',
    editorProps: { attributes: { class: 'tiptap-editor' } },
  })

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title))
  }, [title, slugManual])

  async function handleCoverUpload(file: File) {
    setError('')
    setUploadingCover(true)
    const { data: { session } } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/blog-cover', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: formData,
    })
    const body = await res.json()
    if (!res.ok) { setError(body.error ?? 'Erreur inconnue'); setUploadingCover(false); return }
    setCoverImage(body.url)
    setUploadingCover(false)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Le titre est requis.'); return }
    if (!slug.trim()) { setError('Le slug est requis.'); return }
    setError('')
    setSaving(true)

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content: editor?.getHTML() ?? '',
      status,
      cover_image: coverImage,
      published_at: new Date(publishedAt).toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: err } = post?.id
      ? await supabase.from('posts').update(payload).eq('id', post.id)
      : await supabase.from('posts').insert(payload)

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    onSaved()
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnGhost}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Retour
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
          {post?.id ? "Modifier l'article" : 'Nouvel article'}
        </h2>

        {/* Statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isScheduled && (
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: 999, background: 'rgba(240,168,48,0.2)', color: '#f0a830' }}>
              Programmé
            </span>
          )}
          <div style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            {(['draft', 'published'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{ padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: status === s ? (s === 'published' ? 'rgba(77,184,170,0.25)' : 'rgba(255,255,255,0.12)') : 'transparent', color: status === s ? (s === 'published' ? '#4db8aa' : '#fff') : 'rgba(255,255,255,0.4)' }}
              >
                {s === 'draft' ? 'Brouillon' : 'Publié'}
              </button>
            ))}
          </div>
        </div>

        {/* Sauvegarder */}
        <button onClick={handleSave} disabled={saving} style={btnPrimary(saving)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {/* ── Date de publication ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Date de publication :</span>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={e => setPublishedAt(e.target.value)}
          style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', color: 'rgba(255,255,255,0.8)', padding: '0.3rem 0.6rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }}
        />
        {isScheduled && (
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            L&apos;article passera en ligne automatiquement à cette date.
          </span>
        )}
      </div>

      {/* ── Image de couverture ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="Couverture de l'article" className="object-cover" style={{ width: 120, height: 72, borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.15)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ ...btnGhost, display: 'inline-flex', width: 'fit-content' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>image</span>
            {uploadingCover ? 'Envoi…' : coverImage ? "Changer l'image de couverture" : "Ajouter une image de couverture"}
            <input
              type="file"
              accept="image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
              disabled={uploadingCover}
              style={{ display: 'none' }}
            />
          </label>
          {coverImage && (
            <button onClick={() => setCoverImage(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>
              Retirer l&apos;image
            </button>
          )}
        </div>
      </div>

      {/* ── Titre ── */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre de l'article *"
        style={{ width: '100%', fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.5rem 0', marginBottom: '1rem', outline: 'none', fontFamily: 'inherit' }}
      />

      {/* ── Slug ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Slug :</span>
        <input
          type="text"
          value={slug}
          onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
          style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.6rem', outline: 'none', fontFamily: 'monospace' }}
        />
      </div>

      {/* ── Toolbar + Éditeur ── */}
      {editor && <Toolbar editor={editor} />}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none', borderRadius: '0 0 0.875rem 0.875rem', padding: '1.25rem 1.5rem', minHeight: 380 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

/* ── Toolbar ───────────────────────────────────────── */

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien :', prev ?? 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.125rem', padding: '0.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.875rem 0.875rem 0 0', alignItems: 'center' }}>
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
        <strong style={{ fontFamily: 'serif' }}>B</strong>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
        <em style={{ fontFamily: 'serif' }}>I</em>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné">
        <u>U</u>
      </Btn>

      <Sep />

      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">H1</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">H2</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">H3</Btn>

      <Sep />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>format_list_bulleted</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>format_list_numbered</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>format_quote</span>
      </Btn>
      <Btn onClick={setLink} active={editor.isActive('link')} title="Lien">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>link</span>
      </Btn>

      <Sep />

      <Btn onClick={() => editor.chain().focus().undo().run()} active={false} title="Annuler">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>undo</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} active={false} title="Refaire">
        <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>redo</span>
      </Btn>
    </div>
  )
}

function Btn({ onClick, active, title, children }: { onClick: () => void; active: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{ padding: '0.35rem 0.5rem', border: 'none', borderRadius: '0.375rem', background: active ? 'rgba(207,53,148,0.25)' : 'transparent', color: active ? '#cf3594' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28 }}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 0.2rem', flexShrink: 0 }} />
}

/* ── Style helpers ─────────────────────────────────── */

const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.5rem 1rem', borderRadius: '0.75rem',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}

const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
  border: 'none', background: '#cf3594', color: '#fff',
  fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1, boxShadow: '0 4px 14px rgba(207,53,148,0.4)',
  fontFamily: 'inherit',
})
