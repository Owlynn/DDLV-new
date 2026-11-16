'use client'

import FocusVideos from '@/components/eleve/FocusVideos'

export default function VideosFormationPage() {
  return <FocusVideos seanceHref={id => `/eleve/formation-focus/seances?seance=${id}`} />
}
