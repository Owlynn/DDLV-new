import { redirect } from 'next/navigation'

// La Formation Focus n'a pas de « Suivi des séances » : ses élèves consultent les séances Focus.
export default function Page() {
  redirect('/eleve/formation-focus/seances')
}
