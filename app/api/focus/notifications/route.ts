import { NextResponse } from 'next/server'
import { getSupabaseAdmin, requireUser } from '@/lib/supabase-admin'
import { envoyerMail } from '@/lib/google-drive'
import { FOCUS_TAG, formatDay } from '@/lib/formation-focus'

// Notifications e-mail du co-suivi Formation Focus, envoyées par le script Google (scripts/drive-focus.gs) :
// - { type: 'rendu', id: devoir_id } : un élève Focus a cliqué « J'ai rendu l'exercice » → e-mail à la formatrice
// - { type: 'commentaire', id: commentaire_id } : nouveau commentaire → e-mail à l'élève de l'enregistrement
// Le navigateur appelle cette route juste après l'action ; elle vérifie en base que l'action a bien eu lieu
// (et vient de l'appelant) avant d'écrire, et ne prévient qu'une fois (table notifications_envoyees).

const EMAIL_FORMATRICE = process.env.NOTIF_ADMIN_EMAIL || 'contactdonnerdelavoix@gmail.com'
const SITE = process.env.NEXT_PUBLIC_BASE_URL || 'https://donnerdelavoix.fr'
const UN_JOUR_MS = 24 * 3600_000

type Admin = ReturnType<typeof getSupabaseAdmin>

export async function POST(req: Request) {
  const user = await requireUser(req)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const type = body?.type
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id || (type !== 'rendu' && type !== 'commentaire')) return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })

  const admin = getSupabaseAdmin()
  try {
    const resultat = type === 'rendu' ? await notifierRendu(admin, user.id, id) : await notifierCommentaire(admin, user.id, id)
    return NextResponse.json(resultat)
  } catch (e) {
    // L'action de l'élève est déjà enregistrée : un e-mail raté ne doit pas la faire échouer
    console.error('[notifications]', e)
    return NextResponse.json({ envoye: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }, { status: 502 })
  }
}

/** Réserve la clé d'envoi ; false si déjà envoyé (depuis moins de `fenetreMs` si précisé). */
async function reserver(admin: Admin, cle: string, fenetreMs?: number) {
  const { data } = await admin.from('notifications_envoyees').select('envoye_at').eq('cle', cle).maybeSingle()
  if (data && (fenetreMs === undefined || Date.now() - Date.parse(data.envoye_at) < fenetreMs)) return false
  const { error } = await admin.from('notifications_envoyees').upsert({ cle, envoye_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  return true
}

async function nomEleve(admin: Admin, userId: string, email?: string | null) {
  const { data } = await admin.from('eleves').select('prenom, nom').eq('user_id', userId).maybeSingle()
  const nom = [data?.prenom, data?.nom].filter(Boolean).join(' ').trim()
  return nom || email || 'Un·e élève'
}

async function titreDevoir(admin: Admin, devoir: { exercice_id: string | null; commentaire: string | null }) {
  if (devoir.exercice_id) {
    const { data } = await admin.from('exercices').select('titre').eq('id', devoir.exercice_id).maybeSingle()
    if (data?.titre) return data.titre as string
  }
  return devoir.commentaire?.split('\n').find(l => l.trim())?.trim() || ''
}

const jour = (key: string) => formatDay(key, { day: '2-digit', month: '2-digit', year: '2-digit' })

const echapper = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function html(titre: string, lignes: string[], lien: { url: string; texte: string }, citation?: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#222">
  <h2 style="color:#5b2ab5;font-size:18px">${echapper(titre)}</h2>
  ${lignes.map(l => `<p style="margin:0 0 10px">${echapper(l)}</p>`).join('')}
  ${citation ? `<blockquote style="margin:12px 0;padding:10px 14px;border-left:3px solid #cf3594;background:#f7f2fb;white-space:pre-wrap">${echapper(citation)}</blockquote>` : ''}
  <p style="margin:18px 0"><a href="${lien.url}" style="background:#cf3594;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">${echapper(lien.texte)}</a></p>
  <p style="color:#888;font-size:12px">Donner de la Voix · Formation Focus</p>
</div>`
}

async function notifierRendu(admin: Admin, userId: string, devoirId: string) {
  // Le rendu existe bien, pour cet élève et ce devoir Focus
  const [{ data: rendu }, { data: devoir }] = await Promise.all([
    admin.from('devoirs_rendus').select('date_rendu').eq('devoir_id', devoirId).eq('user_id', userId).maybeSingle(),
    admin.from('devoirs').select('date_limite, contexte, exercice_id, commentaire').eq('id', devoirId).maybeSingle(),
  ])
  if (!rendu || !devoir) return { envoye: false, raison: 'rendu introuvable' }
  if (devoir.contexte !== FOCUS_TAG) return { envoye: false, raison: 'pas un devoir Focus' }
  if (!(await reserver(admin, `rendu:${devoirId}:${userId}`, UN_JOUR_MS))) return { envoye: false, raison: 'déjà notifié' }

  const { data: u } = await admin.auth.admin.getUserById(userId)
  const nom = await nomEleve(admin, userId, u.user?.email)
  const titre = await titreDevoir(admin, devoir)
  const devoirTexte = `le devoir du ${jour(devoir.date_limite)}${titre ? ` (« ${titre} »)` : ''}`
  const lien = { url: `${SITE}/admin`, texte: 'Ouvrir l’admin' }
  await envoyerMail({
    to: EMAIL_FORMATRICE,
    subject: `Devoir rendu : ${nom} · ${jour(devoir.date_limite)}`,
    text: `${nom} a indiqué avoir rendu ${devoirTexte}.\n\nPensez à attribuer son fichier dans /admin → Formation Focus → Fichiers du Drive.\n\n${lien.url}`,
    html: html('Devoir rendu', [`${nom} a indiqué avoir rendu ${devoirTexte}.`, 'Pensez à attribuer son fichier dans Formation Focus → Fichiers du Drive.'], lien),
  })
  return { envoye: true }
}

async function notifierCommentaire(admin: Admin, userId: string, commentaireId: string) {
  // Le commentaire existe et a été écrit par l'appelant
  const { data: c } = await admin.from('devoirs_commentaires').select('auteur_id, contenu, public, enregistrement_id').eq('id', commentaireId).maybeSingle()
  if (!c || c.auteur_id !== userId) return { envoye: false, raison: 'commentaire introuvable' }
  const { data: e } = await admin.from('devoirs_enregistrements').select('user_id, devoir_id').eq('id', c.enregistrement_id).maybeSingle()
  if (!e) return { envoye: false, raison: 'enregistrement introuvable' }
  if (e.user_id === userId) return { envoye: false, raison: 'commentaire sur son propre enregistrement' }
  if (!(await reserver(admin, `commentaire:${commentaireId}`))) return { envoye: false, raison: 'déjà notifié' }

  const [{ data: dest }, { data: devoir }] = await Promise.all([
    admin.auth.admin.getUserById(e.user_id),
    admin.from('devoirs').select('date_limite, exercice_id, commentaire').eq('id', e.devoir_id).maybeSingle(),
  ])
  const email = dest.user?.email
  if (!email) return { envoye: false, raison: 'élève sans e-mail' }

  const { data: tags } = await admin.from('student_tags').select('tags').eq('user_id', userId).maybeSingle()
  const auteurAdmin = (tags?.tags ?? []).includes('admin')
  const auteur = await nomEleve(admin, userId)
  const qui = auteurAdmin ? `${auteur} (ta formatrice)` : auteur
  const devoirTexte = devoir ? `le devoir du ${jour(devoir.date_limite)}` : 'ton devoir'
  const prive = c.public ? '' : ' Ce commentaire n’est visible que par toi.'
  const lien = { url: `${SITE}/eleve/formation-focus/co-suivi`, texte: 'Voir dans le co-suivi' }
  await envoyerMail({
    to: email,
    subject: `${auteur} a commenté ton enregistrement`,
    text: `${qui} a commenté ton enregistrement pour ${devoirTexte}.${prive}\n\n« ${c.contenu} »\n\n${lien.url}`,
    html: html('Nouveau commentaire sur ton enregistrement', [`${qui} a commenté ton enregistrement pour ${devoirTexte}.${prive}`], lien, c.contenu),
  })
  return { envoye: true }
}
