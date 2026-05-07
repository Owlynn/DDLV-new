import { NextResponse } from 'next/server'

export async function GET() {
  const userId = process.env.BILLETWEB_USER_ID
  const apiKey = process.env.BILLETWEB_API_KEY
  const baseUrl = process.env.BILLETWEB_BASE_URL || 'https://www.billetweb.fr/api'
  const version = process.env.BILLETWEB_VERSION || '1'
  const eventId = process.env.BILLETWEB_EVENT_ID || ''

  if (!userId || !apiKey) {
    return NextResponse.json({ error: 'Configuration BilletWeb manquante' }, { status: 500 })
  }

  const params = new URLSearchParams({
    user: userId,
    key: apiKey,
    version,
    past: '1',
    online: '1',
    description: '1',
  })
  if (eventId) params.set('event', eventId)

  try {
    const response = await fetch(`${baseUrl}/events?${params.toString()}`, { cache: 'no-store' })
    const data = await response.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' },
    })
  } catch {
    return NextResponse.json({ error: 'Impossible de charger les ateliers' }, { status: 502 })
  }
}
