import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-admin'

const TALLY_FORM_ID = '2EydxM'

export async function GET(req: Request) {
  const caller = await requireUser(req)
  if (!caller) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.TALLY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "TALLY_API_KEY manquante dans les variables d'environnement." }, { status: 500 })
  }

  const res = await fetch(`https://api.tally.so/forms/${TALLY_FORM_ID}/submissions?limit=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `Erreur Tally (${res.status}) : ${text || res.statusText}` }, { status: 502 })
  }

  const data = await res.json()

  const questionLabels: Record<string, string> = {}
  for (const q of data.questions ?? []) {
    questionLabels[q.id] = q.title
  }

  const submissions = (data.submissions ?? [])
    .map((s: any) => ({
      id: s.id,
      submittedAt: s.submittedAt,
      isCompleted: s.isCompleted,
      answers: (s.responses ?? []).map((r: any) => ({
        label: questionLabels[r.questionId] ?? r.questionId,
        value: r.formattedAnswer ?? (typeof r.answer === 'string' ? r.answer : JSON.stringify(r.answer ?? '')),
      })),
    }))
    .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  return NextResponse.json({ submissions })
}
