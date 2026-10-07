// Calendrier de la Formation Focus 2026-2027.
// Source unique : utilisé par la page publique /formation-focus et par l'espace élève /eleve/formation-focus.

export type FocusEventType = 'mercredi' | 'weekend' | 'soiree' | 'rendu'

export const FOCUS_TAG = 'focus2026-2027'

// Dossier Google Drive partagé où les élèves déposent leurs enregistrements de devoirs
export const FOCUS_DRIVE_URL = 'https://drive.google.com/drive/folders/1UCjBKkOtYSDHMnGqHF6ht7wXVOgReibX?usp=sharing'

export const dotColors: Record<FocusEventType, string> = {
  mercredi: '#5ec8d8',
  weekend: '#8b6ec0',
  soiree: '#f0a830',
  rendu: '#e8789c',
}

export const legend: { type: FocusEventType; label: string }[] = [
  { type: 'mercredi', label: 'Mercredi' },
  { type: 'weekend', label: 'Week-end' },
  { type: 'soiree', label: 'Soirée publique' },
  { type: 'rendu', label: 'Rendu devoir' },
]

export const events: Record<string, FocusEventType> = {
  '2026-10-07': 'mercredi', '2026-10-21': 'mercredi',
  '2026-10-24': 'weekend', '2026-10-25': 'weekend',
  '2026-10-16': 'rendu',

  '2026-11-04': 'mercredi', '2026-11-18': 'mercredi',
  '2026-11-02': 'soiree',
  '2026-11-13': 'rendu', '2026-11-27': 'rendu',

  '2026-12-16': 'mercredi',
  '2026-12-19': 'weekend', '2026-12-20': 'weekend',
  '2026-12-18': 'rendu',

  '2027-01-06': 'mercredi', '2027-01-20': 'mercredi',
  '2027-01-15': 'rendu', '2027-01-29': 'rendu',

  '2027-02-17': 'mercredi',
  '2027-02-13': 'weekend', '2027-02-14': 'weekend',
  '2027-02-15': 'soiree',
  '2027-02-12': 'rendu', '2027-02-26': 'rendu',

  '2027-03-03': 'mercredi', '2027-03-17': 'mercredi', '2027-03-31': 'mercredi',
  '2027-03-12': 'rendu', '2027-03-26': 'rendu',

  '2027-04-28': 'mercredi',
  '2027-04-17': 'weekend', '2027-04-18': 'weekend',
  '2027-04-09': 'rendu', '2027-04-23': 'rendu',

  '2027-05-05': 'mercredi', '2027-05-19': 'mercredi',
  '2027-05-17': 'soiree',
  '2027-05-14': 'rendu', '2027-05-28': 'rendu',

  '2027-06-09': 'mercredi',
  '2027-06-12': 'weekend', '2027-06-13': 'weekend',
}


export const calendarMonths: [number, number, string][] = [
  [2026, 9, 'Octobre 2026'],
  [2026, 10, 'Novembre 2026'],
  [2026, 11, 'Décembre 2026'],
  [2027, 0, 'Janvier 2027'],
  [2027, 1, 'Février 2027'],
  [2027, 2, 'Mars 2027'],
  [2027, 3, 'Avril 2027'],
  [2027, 4, 'Mai 2027'],
  [2027, 5, 'Juin 2027'],
]

export const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function buildMonthCells(year: number, monthIdx: number) {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const startOffset = (new Date(year, monthIdx, 1).getDay() + 6) % 7
  const cells: { day: number | null; type?: FocusEventType }[] = []
  for (let i = 0; i < startOffset; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: events[dateKey(year, monthIdx, d)] })
  }
  return cells
}

export interface FocusSession {
  type: Exclude<FocusEventType, 'rendu'>
  dates: string[] // un week-end regroupe ses deux jours
  label: string
}

/** Séances (mercredis, week-ends, soirées publiques) triées et numérotées par type. */
export function getSessions(): FocusSession[] {
  const sorted = Object.entries(events).filter(([, t]) => t !== 'rendu').sort(([a], [b]) => a.localeCompare(b))
  const sessions: FocusSession[] = []
  const counts = { mercredi: 0, weekend: 0, soiree: 0 }
  for (const [date, type] of sorted) {
    if (type === 'rendu') continue
    const prev = sessions[sessions.length - 1]
    if (type === 'weekend' && prev?.type === 'weekend' && daysBetween(prev.dates[prev.dates.length - 1], date) === 1) {
      prev.dates.push(date)
      continue
    }
    counts[type]++
    const label = type === 'mercredi' ? `Séance du mercredi n°${counts.mercredi}`
      : type === 'weekend' ? `Week-end d'approfondissement n°${counts.weekend}`
      : `Soirée de pratique publique n°${counts.soiree}`
    sessions.push({ type, dates: [date], label })
  }
  return sessions
}

export interface FocusDevoir {
  date: string
  label: string
}

export function getDevoirs(): FocusDevoir[] {
  return Object.entries(events)
    .filter(([, t]) => t === 'rendu')
    .map(([date]) => date)
    .sort()
    .map((date, i) => ({ date, label: `Devoir n°${i + 1}` }))
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export interface FocusAgendaItem {
  date: string
  type: FocusEventType
  label: string
}

/** Toutes les dates de la formation (séances jour par jour + rendus), triées. */
export function getAgenda(): FocusAgendaItem[] {
  const items: FocusAgendaItem[] = []
  for (const s of getSessions()) {
    s.dates.forEach((date, i) => items.push({ date, type: s.type, label: s.dates.length > 1 ? `${s.label} · jour ${i + 1}` : s.label }))
  }
  for (const d of getDevoirs()) items.push({ date: d.date, type: 'rendu', label: `Rendu du ${d.label.toLowerCase()}` })
  return items.sort((a, b) => a.date.localeCompare(b.date))
}

/* ── Dates (clés 'YYYY-MM-DD' en heure locale) ── */

export function dateKey(year: number, monthIdx: number, day: number) {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function todayKey() {
  const d = new Date()
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

export function parseDay(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return parseDay(key).toLocaleDateString('fr-FR', opts)
}
