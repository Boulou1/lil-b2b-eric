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
  // Laisse '' pour cacher un bouton
  lienLydia: 'https://pay.lydia.me/l?t=alberict541y',
  lienRevolut: 'https://revolut.me/alberict01',
  // Bot Telegram qui t'envoie la liste (laisse '' pour ne pas l'utiliser)
  // ⚠️ Ne publie jamais le token : il reste uniquement dans Apps Script
  telegramToken: '',
  telegramChatId: '',
};
// =====================================================

const NOM_ONGLET = 'Inscriptions';
const ENTETES = ['Date', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Payé avec', 'Vérifié ?'];
const COL_EMAIL = 4;

// La page (sur GitHub Pages) demande les infos de la soirée
function doGet() {
  return json_(getInfos());
}

// La page envoie { action: 'verifier' | 'confirmer', prenom, nom, email, tel, moyen }
function doPost(e) {
  try {
    const donnees = JSON.parse(e.postData.contents);
    if (donnees.action === 'verifier') return json_(verifier(donnees));
    if (donnees.action === 'confirmer') return json_(confirmer(donnees));
    throw new Error('Action inconnue.');
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
  const c = CONFIG;
  return {
    nomEvent: c.nomEvent, style: c.style, date: c.date, horaires: c.horaires,
    lieu: c.lieu, adresse: c.adresse, prix: c.prix, capacite: c.capacite,
    lienLydia: c.lienLydia, lienRevolut: c.lienRevolut,
    restantes: Math.max(c.capacite - nbInscrits_(feuille_()), 0),
  };
}

function lireFormulaire_(f) {
  const p = {
    prenom: String(f.prenom || '').trim(),
    nom: String(f.nom || '').trim(),
    email: String(f.email || '').trim().toLowerCase(),
    tel: String(f.tel || '').trim(),
    moyen: String(f.moyen || '').trim(),
  };
  if (!p.prenom || !p.nom || !/^\S+@\S+\.\S+$/.test(p.email)) {
    throw new Error('Remplis ton prénom, ton nom et un email valide.');
  }
  return p;
}

// Places restantes et email pas déjà inscrit ; renvoie le nombre d'inscrits
function controler_(sh, email) {
  const n = nbInscrits_(sh);
  if (n > 0) {
    const emails = sh.getRange(2, COL_EMAIL, n, 1).getValues().flat()
      .map(function (e) { return String(e).toLowerCase(); });
    if (emails.indexOf(email) !== -1) {
      throw new Error('Cet email est déjà sur la liste 🪩');
    }
  }
  if (n >= CONFIG.capacite) {
    throw new Error('C\'est complet, plus aucune place disponible.');
  }
  return n;
}

// Avant d'envoyer la personne payer
function verifier(f) {
  const p = lireFormulaire_(f);
  controler_(feuille_(), p.email);
  return { ok: true };
}

// Quand la personne clique sur « J'ai payé »
function confirmer(f) {
  const p = lireFormulaire_(f);

  // Verrou : deux personnes qui confirment en même temps ne peuvent pas dépasser la jauge
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let numero;
  try {
    const sh = feuille_();
    numero = controler_(sh, p.email) + 1;
    // L'apostrophe empêche Sheets de transformer le numéro en nombre
    sh.appendRow([new Date(), p.prenom, p.nom, p.email, p.tel ? "'" + p.tel : '', p.moyen, false]);
    sh.getRange(sh.getLastRow(), ENTETES.length).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }

  // Si le mail ou Telegram échoue, l'inscription reste valable
  try {
    envoyerConfirmation_(p.prenom, p.email);
  } catch (e) {
    console.error('Mail non envoyé à ' + p.email + ' : ' + e);
  }
  try {
    prevenirTelegram_(p, numero);
  } catch (e) {
    console.error('Telegram : ' + e);
  }
  return { numero: numero, restantes: CONFIG.capacite - numero };
}

function echapper_(t) {
  return String(t).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function envoyerConfirmation_(prenom, email) {
  const c = CONFIG;
  const html =
    '<div style="font-family:Arial,sans-serif;background:#f6e2c4;color:#2340c4;padding:24px;border-radius:12px;max-width:480px">' +
      '<h1 style="color:#e62a2a;margin:0 0 4px">' + echapper_(c.nomEvent) + '</h1>' +
      '<p style="margin:0 0 16px">' + echapper_(c.style || '') + '</p>' +
      '<p>Salut ' + echapper_(prenom) + ', c\'est bon, <b>tu es sur la liste</b> 🪩</p>' +
      '<p>À l\'entrée, donne simplement ton prénom et ton nom.</p>' +
      '<p>📅 ' + echapper_(c.date) + (c.horaires ? ' · ' + echapper_(c.horaires) : '') + '<br>' +
        '📍 ' + echapper_(c.lieu) + (c.adresse ? '<br>' + echapper_(c.adresse) : '') + '</p>' +
      '<p>À vendredi ! 💿</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: '🎟️ ' + c.nomEvent + ' – tu es sur la liste',
    htmlBody: html,
    name: c.nomEvent,
  });
}

function telegram_(texte) {
  const c = CONFIG;
  if (!c.telegramToken || !c.telegramChatId) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + c.telegramToken + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: c.telegramChatId, text: texte.slice(0, 4000) }),
  });
}

function prevenirTelegram_(p, numero) {
  const sh = feuille_();
  const n = nbInscrits_(sh);
  const lignes = n > 0 ? sh.getRange(2, 2, n, 5).getValues() : [];
  const liste = lignes.map(function (l, i) {
    return (i + 1) + '. ' + l[0] + ' ' + l[1] + (l[4] ? ' (' + l[4] + ')' : '');
  }).join('\n');

  telegram_(
    '✅ Nouvelle place ' + numero + '/' + CONFIG.capacite + ' : ' + p.prenom + ' ' + p.nom +
    (p.moyen ? ' — ' + p.moyen : '') + '\n\n' +
    '🎟️ Liste (' + n + ') :\n' + liste
  );
}

// À lancer une fois depuis l'éditeur (▶ Exécuter) : donne les autorisations
// et vérifie que le bot Telegram t'écrit bien
function test() {
  feuille_();
  telegram_('🪩 Le bot de ' + CONFIG.nomEvent + ' est branché !');
}
