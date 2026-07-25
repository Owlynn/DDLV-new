export type BlogPost = {
  id?: string
  title: string
  slug: string
  content: string
  cover_image: string | null
  published_at: string
}

export function excerpt(html: string, max = 160): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
