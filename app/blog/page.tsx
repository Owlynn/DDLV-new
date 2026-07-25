import type { Metadata } from 'next'
import SocialBar from '@/components/SocialBar'
import BlogGrid from '@/components/BlogGrid'
import { supabase } from '@/lib/supabase-client'
import type { BlogPost } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog | Donner de la Voix',
  description: 'Articles sur le chant, l\'improvisation vocale et les circlesongs, par Donner de la Voix à Toulouse.',
  alternates: { canonical: 'https://donnerdelavoix.fr/blog' },
}

export const revalidate = 300

async function getPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, content, cover_image, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
    if (error || !data) return []
    return data as BlogPost[]
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="flex-1 overflow-y-auto relative" role="main">
      <section className="hero-overlay relative min-h-screen overflow-hidden flex items-center pt-28 sm:pt-32 pb-12" aria-label="Hero">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-12">
          <div className="flex flex-col items-start gap-6 sm:gap-8 lg:w-[36%] lg:shrink-0 lg:pt-4">
            <h1 className="text-[2.4rem] sm:text-[3.2rem] lg:text-[3.6rem] font-bold tracking-tight text-white leading-tight">
              <span className="hero-gradient-word block">Blog</span>
            </h1>
            <p className="text-white/90 text-lg sm:text-xl font-medium leading-relaxed">
              Réflexions et ressources sur le chant, l&apos;improvisation vocale et les circlesongs.
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <BlogGrid posts={posts} />
          </div>
        </div>
      </section>

      <SocialBar />
    </main>
  )
}
