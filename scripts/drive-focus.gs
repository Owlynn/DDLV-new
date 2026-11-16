/**
 * Drive Focus → site Donner de la Voix (co-suivi Formation Focus).
 *
 * Petit script Google Apps Script, exécuté avec TON compte Google : il donne au site la liste des fichiers
 * du dossier Drive Focus et leur contenu (par morceaux), sans rendre les fichiers publics,
 * et envoie les e-mails de notification du co-suivi (doPost).
 * Le site l'appelle côté serveur avec un jeton secret (variables GOOGLE_APPS_SCRIPT_URL et GOOGLE_APPS_SCRIPT_TOKEN).
 *
 * Installation : voir app/api/admin/drive/files/route.ts ou /admin → Formation Focus → Fichiers du Drive.
 */

// Dossier Drive Focus (même id que FOCUS_DRIVE_FOLDER_ID dans lib/formation-focus.ts)
const DOSSIER_FOCUS = '1UCjBKkOtYSDHMnGqHF6ht7wXVOgReibX'

// Jeton secret partagé avec le site : le même que GOOGLE_APPS_SCRIPT_TOKEN
const JETON = 'COLLER_ICI_LE_JETON'

// Taille d'un morceau de fichier (une réponse du site ne doit pas dépasser 4,5 Mo sur Vercel)
const TAILLE_MORCEAU = 2 * 1024 * 1024

function doGet(e) {
  const p = e.parameter || {}
  if (!p.token || p.token !== JETON) return reponse({ error: 'Jeton invalide' })
  try {
    if (p.action === 'list') return reponse({ files: lister(DriveApp.getFolderById(DOSSIER_FOCUS), '', 0) })
    if (p.action === 'file') return reponse(morceau(p.id, Number(p.start || 0)))
    return reponse({ error: 'Action inconnue' })
  } catch (err) {
    return reponse({ error: String(err && err.message ? err.message : err) })
  }
}

/**
 * Envoi d'un e-mail de notification (devoir rendu, nouveau commentaire), depuis le compte Google du script.
 * Corps JSON : { token, action: 'mail', to, subject, text, html }. Quota Gmail : 100 e-mails par jour.
 */
function doPost(e) {
  let p = {}
  try { p = JSON.parse((e.postData && e.postData.contents) || '{}') } catch (err) { return reponse({ error: 'JSON invalide' }) }
  if (!p.token || p.token !== JETON) return reponse({ error: 'Jeton invalide' })
  try {
    if (p.action === 'mail') {
      if (!p.to || !p.subject || !p.text) return reponse({ error: 'Destinataire, sujet ou texte manquant' })
      MailApp.sendEmail({ to: p.to, subject: p.subject, body: p.text, htmlBody: p.html || undefined, name: 'Donner de la Voix' })
      return reponse({ ok: true, restant: MailApp.getRemainingDailyQuota() })
    }
    return reponse({ error: 'Action inconnue' })
  } catch (err) {
    return reponse({ error: String(err && err.message ? err.message : err) })
  }
}

function reponse(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON)
}

/** Fichiers du dossier et de ses sous-dossiers (3 niveaux au plus). */
function lister(dossier, chemin, profondeur) {
  const resultat = []
  const fichiers = dossier.getFiles()
  while (fichiers.hasNext()) {
    const f = fichiers.next()
    resultat.push({
      id: f.getId(),
      name: f.getName(),
      mimeType: f.getMimeType(),
      modifiedTime: f.getLastUpdated().toISOString(),
      size: String(f.getSize()),
      dossier: chemin,
    })
  }
  if (profondeur < 3) {
    const sous = dossier.getFolders()
    while (sous.hasNext()) {
      const s = sous.next()
      lister(s, chemin ? chemin + ' / ' + s.getName() : s.getName(), profondeur + 1).forEach(function (x) { resultat.push(x) })
    }
  }
  return resultat
}

/** Le fichier est-il dans le dossier Focus (ou un de ses sous-dossiers) ? Empêche de lire le reste du Drive. */
function dansLeDossierFocus(fichier) {
  let niveau = [fichier.getParents()]
  for (let i = 0; i < 5; i++) {
    const suivant = []
    for (let n = 0; n < niveau.length; n++) {
      const parents = niveau[n]
      while (parents.hasNext()) {
        const p = parents.next()
        if (p.getId() === DOSSIER_FOCUS) return true
        suivant.push(p.getParents())
      }
    }
    if (!suivant.length) return false
    niveau = suivant
  }
  return false
}

/** Un morceau du fichier, à partir de l'octet `debut`, encodé en base64. */
function morceau(id, debut) {
  const f = DriveApp.getFileById(id)
  if (!dansLeDossierFocus(f)) throw new Error('Fichier hors du dossier Focus')
  const octets = f.getBlob().getBytes()
  const total = octets.length
  const start = Math.max(0, Math.min(debut || 0, Math.max(total - 1, 0)))
  const end = Math.min(start + TAILLE_MORCEAU, total) - 1
  return {
    mimeType: f.getMimeType(),
    total: total,
    start: start,
    end: end,
    data: Utilities.base64Encode(octets.slice(start, end + 1)),
  }
}
