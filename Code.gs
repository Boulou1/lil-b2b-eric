// ================== À PERSONNALISER ==================
const CONFIG = {
  nomEvent: 'LIL B2B ERIC',
  style: 'Disco · House · Tek',
  date: 'Vendredi 20 novembre',
  horaires: '21h – 2h',
  lieu: 'Goldie – La Brasserie des Arts',
  adresse: '28 rue Saint-André des Arts, 75006 Paris',
  prix: 10,
  capacite: 70,
  // Lien public vers l'image de l'affiche (voir GUIDE.md), '' pour ne pas l'afficher
  affiche: '',
  // Laisse '' pour cacher un bouton
  lienLydia: 'https://pay.lydia.me/l?t=alberict541y',
  lienRevolut: 'https://revolut.me/alberict01',
};
// =====================================================

const NOM_ONGLET = 'Inscriptions';
const ENTETES = ['Date', 'Code', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Payé ?'];

function doGet(e) {
  // Appelé par la version GitHub Pages du site
  if (e && e.parameter && e.parameter.api === 'infos') {
    return json_(getInfos());
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.nomEvent)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Réservation envoyée par la version GitHub Pages du site
function doPost(e) {
  try {
    return json_(reserver(JSON.parse(e.postData.contents)));
  } catch (err) {
    return json_({ erreur: err.message });
  }
}

function json_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

function feuille_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(NOM_ONGLET);
  if (!sh) {
    sh = ss.insertSheet(NOM_ONGLET);
    sh.appendRow(ENTETES);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, ENTETES.length).setFontWeight('bold');
  }
  return sh;
}

function nbInscrits_(sh) {
  return Math.max(sh.getLastRow() - 1, 0);
}

function getInfos() {
  const restantes = Math.max(CONFIG.capacite - nbInscrits_(feuille_()), 0);
  return Object.assign({}, CONFIG, { restantes: restantes });
}

function reserver(form) {
  const prenom = String(form.prenom || '').trim();
  const nom = String(form.nom || '').trim();
  const email = String(form.email || '').trim().toLowerCase();
  const tel = String(form.tel || '').trim();

  if (!prenom || !nom || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Remplis ton prénom, ton nom et un email valide.');
  }

  // Verrou : deux personnes qui réservent en même temps ne peuvent pas dépasser la jauge
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let resultat;
  try {
    const sh = feuille_();
    const n = nbInscrits_(sh);

    if (n > 0) {
      const emails = sh.getRange(2, 5, n, 1).getValues().flat()
        .map(function (e) { return String(e).toLowerCase(); });
      if (emails.indexOf(email) !== -1) {
        throw new Error('Cet email est déjà inscrit.');
      }
    }
    if (n >= CONFIG.capacite) {
      throw new Error('C\'est complet, plus aucune place disponible.');
    }

    const code = Utilities.getUuid().replace(/-/g, '').slice(0, 5).toUpperCase();
    // L'apostrophe empêche Sheets de transformer le numéro en nombre
    sh.appendRow([new Date(), code, prenom, nom, email, tel ? "'" + tel : '', false]);
    sh.getRange(sh.getLastRow(), 7).insertCheckboxes();

    resultat = { code: code, restantes: CONFIG.capacite - n - 1 };
  } finally {
    lock.releaseLock();
  }

  // Si le mail échoue (quota, adresse invalide…), la réservation reste valable
  try {
    envoyerConfirmation_(prenom, email, resultat.code);
  } catch (e) {
    console.error('Mail non envoyé à ' + email + ' : ' + e);
  }
  return resultat;
}

function echapper_(t) {
  return String(t).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function envoyerConfirmation_(prenom, email, code) {
  const c = CONFIG;
  const bouton = function (lien, texte, fond, couleur) {
    return lien ? '<p><a href="' + lien + '" style="display:inline-block;padding:12px 22px;border-radius:10px;' +
      'background:' + fond + ';color:' + couleur + ';text-decoration:none;font-weight:bold">' + texte + '</a></p>' : '';
  };

  const html =
    '<div style="font-family:Arial,sans-serif;background:#f6e2c4;color:#2340c4;padding:24px;border-radius:12px;max-width:480px">' +
      '<h1 style="color:#e62a2a;margin:0 0 4px">' + echapper_(c.nomEvent) + '</h1>' +
      '<p style="margin:0 0 16px">' + echapper_(c.style || '') + '</p>' +
      '<p>Salut ' + echapper_(prenom) + ', ta place est réservée 🪩</p>' +
      '<p>Ton code :</p>' +
      '<p style="font-size:30px;letter-spacing:6px;color:#e62a2a;border:3px dashed #e62a2a;' +
        'border-radius:10px;padding:8px;text-align:center;font-weight:bold">' + code + '</p>' +
      '<p><b>Pour valider ta place</b>, paie ' + c.prix + ' € en écrivant ton code <b>' + code +
        '</b> dans le message du paiement :</p>' +
      bouton(c.lienLydia, 'Payer avec Lydia', '#2340c4', '#ffffff') +
      bouton(c.lienRevolut, 'Payer avec Revolut', '#f6bd2c', '#2340c4') +
      '<p>📅 ' + echapper_(c.date) + (c.horaires ? ' · ' + echapper_(c.horaires) : '') + '<br>' +
        '📍 ' + echapper_(c.lieu) + (c.adresse ? '<br>' + echapper_(c.adresse) : '') + '</p>' +
      '<p style="font-size:13px;opacity:.75">Sans paiement, la réservation peut être annulée.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: '🎟️ ' + c.nomEvent + ' – ta place (code ' + code + ')',
    htmlBody: html,
    name: c.nomEvent,
  });
}
