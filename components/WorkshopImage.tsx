'use client'

const GRADIENT = `
  radial-gradient(ellipse 60% 55% at 12% 88%, rgba(72,205,188,0.65) 0%, transparent 55%),
  radial-gradient(ellipse 52% 52% at 90% 80%, rgba(232,72,162,0.72) 0%, transparent 52%),
  radial-gradient(ellipse 46% 46% at 78% 10%, rgba(110,72,200,0.52) 0%, transparent 50%),
  linear-gradient(145deg, #c4b0e8 0%, #d8c8f4 30%, #e2d0f6 58%, #eed0ee 100%)
`.trim()

export default function WorkshopImage({
  title,
  dateDisplay,
}: {
  src?: string
  alt?: string
  title: string
  dateDisplay: string
}) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: GRADIENT }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.28)' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-1.5">
        <span className="font-bold text-xs sm:text-sm uppercase tracking-widest text-white leading-tight drop-shadow">
          {title}
        </span>
        <span className="text-[10px] sm:text-xs text-white/85 uppercase tracking-widest drop-shadow">
          {dateDisplay}
        </span>
      </div>
    </>
  )
}
