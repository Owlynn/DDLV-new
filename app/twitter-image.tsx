import { ImageResponse } from 'next/og'

export const alt = 'Donner de la Voix – Circlesongs, chant & improvisation vocale à Toulouse'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d0218 0%, #2a0e4a 45%, #5b2ab5 75%, #cf3594 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, color: '#ffffff', letterSpacing: -2 }}>
          Donner de la Voix
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 34, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
          Circlesongs · Chant · Improvisation vocale — Toulouse
        </div>
      </div>
    ),
    { ...size }
  )
}
