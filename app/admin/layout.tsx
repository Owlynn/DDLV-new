import type { Metadata } from 'next'

// Le backoffice ne doit jamais être indexé (en plus du Disallow de robots.ts).
export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
