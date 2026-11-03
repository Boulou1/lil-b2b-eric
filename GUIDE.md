# Mettre en ligne ta billetterie (gratuit, ~15 min)

Deux morceaux, tous les deux gratuits :
- **Google (Sheets + Apps Script)** : compte les places, enregistre les inscrits dans un Google Sheet et envoie les mails. C'est le « cerveau ».
- **GitHub Pages (compte boulou1)** : héberge la jolie page avec un lien propre `boulou1.github.io/…`.

## 1. Créer le Google Sheet
1. Va sur [sheets.new](https://sheets.new) et nomme le fichier « Billetterie LIL B2B ERIC ».
2. Menu **Extensions → Apps Script**.

## 2. Coller le code
1. Dans l'éditeur Apps Script, efface tout le contenu de `Code.gs` et colle le contenu du fichier **Code.gs**.
2. Clique sur **+** à côté de « Fichiers » → **HTML**, nomme-le exactement `Index` (sans `.html`), efface son contenu et colle le contenu du fichier **index.html**.
3. Vérifie le bloc `CONFIG` en haut de `Code.gs` (déjà rempli : infos de la soirée, 70 places, liens Lydia et Revolut).
4. Clique sur 💾 **Enregistrer**.

## 3. Déployer côté Google
1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Clique sur ⚙️ à côté de « Type » → **Application Web**.
3. Choisis :
   - **Exécuter en tant que** : Moi
   - **Qui a accès** : Tout le monde
4. **Déployer** → Google te demande des autorisations → **Autoriser l'accès**.
   - Si tu vois « Google n'a pas validé cette application » : clique sur **Paramètres avancés → Accéder à … (non sécurisé)**. C'est normal, c'est ton propre script.
5. Copie l'**URL de l'application Web** (elle finit par `/exec`) et **envoie-la à Claude** : il la branche sur la page GitHub.

> 📩 **Mail de confirmation** : à chaque réservation, la personne reçoit un email avec son code et les liens de paiement. Il part **depuis ton adresse Gmail** (c'est pour ça que Google te demande l'autorisation « Envoyer des e-mails en votre nom »). Limite : environ 100 mails par jour avec un compte Gmail gratuit, largement assez pour 70 places.

## 4. Publier sur GitHub (compte boulou1)
1. Connecte le compte boulou1 dans le terminal (ça ouvre le navigateur, c'est toi qui te connectes) :
   ```bash
   gh auth login
   ```
   Choisis GitHub.com → HTTPS → « Login with a web browser ».
2. Dis à Claude que c'est fait : il crée le dépôt, publie la page et te donne le lien final.

**Teste** : fais une réservation avec ta propre adresse sur le lien GitHub, vérifie que la ligne apparaît dans le Sheet et que tu reçois le mail, puis supprime la ligne.

## 5. Pendant la vente
- Chaque réservation ajoute une ligne dans l'onglet **Inscriptions** avec un **code** à 5 caractères.
- Les gens paient avec Lydia/Revolut en mettant leur code dans le message.
- Quand tu reçois un paiement, **coche la case « Payé ? »** de la bonne ligne.
- À 70 inscrits, le site affiche automatiquement **« Sold out »**.
- Quelqu'un a réservé sans payer ? **Supprime sa ligne** (clic droit → Supprimer la ligne) : la place se libère.

## 6. Récupérer la liste en Excel
Dans le Google Sheet : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.
Tu as un fichier Excel avec tous les inscrits à l'instant T. Refais-le quand tu veux une version à jour (par exemple le jour J).

## 7. Le jour J
Filtre la colonne « Payé ? » sur coché : c'est ta liste d'entrée. Les gens te montrent leur code ou leur nom.

## Modifier après la mise en ligne
- **Code.gs (CONFIG, places, liens)** : dans Apps Script, **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer**. L'URL `/exec` reste la même.
- **La page (index.html)** : demande à Claude, il republie sur GitHub.
