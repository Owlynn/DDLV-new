import { redirect } from 'next/navigation'

// Ancienne adresse de l'onglet « Vidéos »
export default function PlaylistRedirect() {
  redirect('/eleve/formation-focus/videos')
}
