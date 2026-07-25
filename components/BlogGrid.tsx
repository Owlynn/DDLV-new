'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { excerpt, formatDateFr, type BlogPost } from '@/lib/blog'

const TINTS = ['bento-tint-primary', 'bento-tint-accent', 'bento-tint-teal']
const PAGE_SIZE = 4

export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [page, setPage] = useState(1)

  if (posts.length === 0) {
    return (
      <div className="glass-panel-rose bento-tint-primary rounded-2xl p-8 text-center bento-content-glass relative overflow-hidden">
        <div className="bento-icon-wrap justify-center"><Info className="bento-icon" /></div>
        <h2 className="text-xl font-bold text-white mb-2">Aucun article pour l&apos;instant</h2>
        <p className="text-white/90 mb-4">De nouveaux articles arrivent bientôt. Revenez faire un tour !</p>
        <Link href="/contact#newsletter" className="btn-rdv">S&apos;abonner à la newsletter</Link>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  const current = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goTo(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages))
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {current.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={`glass-panel-rose ${TINTS[i % TINTS.length]} rounded-2xl flex flex-col relative overflow-hidden bento-content-glass group transition-transform hover:-translate-y-1`}
          >
            {post.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover_image} alt="" className="w-full h-32 object-cover" loading="lazy" />
            )}
            <div className="p-5 flex flex-col gap-2 flex-1">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold m-0">{formatDateFr(post.published_at)}</p>
              <h2 className="text-base font-bold text-white m-0 leading-snug">{post.title}</h2>
              <p className="text-white/85 text-xs leading-relaxed m-0">{excerpt(post.content, 100)}</p>
              <span className="text-[#cf3594] text-xs font-semibold uppercase tracking-widest mt-auto inline-flex items-center gap-1.5">
                Lire l&apos;article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label="Page précédente"
            className="size-9 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white border-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white/70 text-xs uppercase tracking-widest font-semibold">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            aria-label="Page suivante"
            className="size-9 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white border-0 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
