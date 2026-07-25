import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SocialBar from '@/components/SocialBar'
import { supabase } from '@/lib/supabase-client'
import { excerpt, formatDateFr, type BlogPost } from '@/lib/blog'

export const revalidate = 300

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('title, slug, content, cover_image, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .maybeSingle()
    if (error || !data) return null
    return data as BlogPost
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Blog Donner de la Voix`,
    description: excerpt(post.content),
    alternates: { canonical: `https://donnerdelavoix.fr/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <div className="px-4 md:px-8 max-w-3xl mx-auto pt-28 sm:pt-32 pb-24">
        <Link href="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au blog
        </Link>

        <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">{formatDateFr(post.published_at)}</p>
        <h1 className="text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-white leading-tight mb-8">
          {post.title}
        </h1>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt="" className="w-full max-h-[420px] object-cover rounded-2xl mb-8" />
        )}

        <div className="tiptap-editor" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/blog" className="btn-rdv inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Voir tous les articles</Link>
        </div>
      </div>

      <SocialBar />
    </main>
  )
}
