# Brancher la billetterie (gratuit, ~10 min)

La page est déjà en ligne sur **https://boulou1.github.io/lil-b2b-eric/**.
Il reste à brancher le « cerveau » côté Google : il compte les 70 places, garde la liste dans un Google Sheet, envoie les mails et prévient ton bot Telegram.

## 1. Créer le Google Sheet et coller le code
1. Ouvre [sheets.new](https://sheets.new) et nomme le fichier « Billetterie LIL B2B ERIC ».
2. Menu **Extensions → Apps Script**.
3. Efface tout ce qu'il y a dans `Code.gs` et colle le contenu du fichier **Code.gs** (Claude l'a mis dans ton presse-papiers : ⌘V).
4. 💾 **Enregistrer**.

## 2. Créer le bot Telegram (optionnel mais conseillé)
1. Dans Telegram, ouvre **@BotFather** → `/newbot` → donne un nom (ex. « Liste LIL B2B ERIC ») et un pseudo qui finit par `bot`.
2. BotFather te donne un **token** (genre `123456:ABC-xyz…`). Colle-le dans `CONFIG`, ligne `telegramToken: '...'`.
   ⚠️ Ne l'envoie à personne et ne le mets jamais sur GitHub.
3. Ouvre ton nouveau bot (lien donné par BotFather) et appuie sur **Démarrer** (sinon il n'a pas le droit de t'écrire).
4. Ouvre **@userinfobot** → il te répond ton **Id** (un nombre). Colle-le dans `CONFIG`, ligne `telegramChatId: '...'`.
5. 💾 **Enregistrer**.

## 3. Autoriser et tester
1. En haut de l'éditeur, choisis la fonction **`test`** dans la liste, puis **▶ Exécuter**.
2. Google demande des autorisations → **Autoriser l'accès**.
   - « Google n'a pas validé cette application » : **Paramètres avancés → Accéder à … (non sécurisé)**. C'est normal, c'est ton propre script.
3. Tu dois recevoir sur Telegram : « 🪩 Le bot de LIL B2B ERIC est branché ! »

## 4. Déployer
1. **Déployer → Nouveau déploiement** → ⚙️ → **Application Web**.
2. **Exécuter en tant que** : Moi · **Qui a accès** : Tout le monde → **Déployer**.
3. Copie l'**URL de l'application Web** (elle finit par `/exec`) et **envoie-la à Claude** : il la branche sur la page et les réservations s'ouvrent.

## Pendant la vente
- Chaque « ✅ J'ai payé » ajoute une ligne dans l'onglet **Inscriptions**, envoie un mail de confirmation à la personne (depuis ton Gmail) et t'envoie la **liste à jour sur Telegram**.
- La colonne **« Payé avec »** dit si c'est Lydia ou Revolut. La case **« Vérifié ? »** est pour toi si tu veux cocher au fur et à mesure que tu vois les paiements arriver.
- À 70 inscrits, la page affiche **« Sold out »**.
- Quelqu'un qui n'a pas vraiment payé ? **Supprime sa ligne** : la place se libère.

## Récupérer la liste en Excel
Dans le Google Sheet : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.

## Le jour J
La dernière liste Telegram ou le Google Sheet sur ton téléphone = ta liste d'entrée. Les gens donnent leur prénom et leur nom.

## Modifier après coup
Si tu changes `CONFIG` (places, liens…) : **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer**. L'URL `/exec` reste la même.
