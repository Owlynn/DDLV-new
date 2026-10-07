'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { StudentTagKey } from '@/lib/student-tags'

export interface StudentSession { user: User; tags: StudentTagKey[] }

export const StudentContext = createContext<StudentSession | null>(null)

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent doit être utilisé dans /eleve')
  return ctx
}
