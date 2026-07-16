'use client'

export default function FloatingRdv() {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        if (typeof window !== 'undefined' && (window as any).Calendly) {
          (window as any).Calendly.initPopupWidget({ url: 'https://calendly.com/contactdonnerdelavoix/30min' })
        }
      }}
      className="floating-rdv-btn"
      aria-label="Prendre rendez-vous"
    >
      <svg className="floating-rdv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      Prendre RDV
    </a>
  )
}
