'use client'

import DevoirsManager from '@/components/DevoirsManager'
import { useStudent } from '@/components/eleve/StudentContext'
import { FOCUS_DRIVE_URL } from '@/lib/formation-focus'

export default function Page() {
  const { user, tags } = useStudent()
  return <DevoirsManager contexte="focus2026-2027" userId={user.id} canEdit={tags.includes('admin')} depotUrl={FOCUS_DRIVE_URL} />
}
