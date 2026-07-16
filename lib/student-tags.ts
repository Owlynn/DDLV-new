export const STUDENT_TAGS = [
  { key: 'admin', label: 'Admin', color: '#cf3594' },
  { key: 'cours', label: 'Cours', color: '#4db8aa' },
  { key: 'formation', label: 'Formation', color: '#5b2ab5' },
  { key: 'ateliers', label: 'Ateliers', color: '#e0a72e' },
] as const

export type StudentTagKey = typeof STUDENT_TAGS[number]['key']
