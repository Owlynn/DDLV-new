'use client'

import { useState } from 'react'

export type FaqItem = {
  id: number
  question: string
  answer: string
  tint: string
}

export default function FaqCard({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-bento-card glass-panel-rose ${item.tint} rounded-2xl relative overflow-hidden`} role="listitem">
      <button
        type="button"
        className="faq-bento-trigger"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{item.question}</span>
        <span className={`faq-bento-icon material-symbols-outlined ${open ? 'rotate-180' : ''} transition-transform duration-250`} aria-hidden="true">expand_more</span>
      </button>
      <div className={`faq-bento-panel ${open ? 'is-open' : ''}`} style={{ maxHeight: open ? '320px' : '0' }}>
        <div className="faq-bento-panel-inner" dangerouslySetInnerHTML={{ __html: item.answer }} />
      </div>
    </div>
  )
}
