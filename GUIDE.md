# Brancher la billetterie (gratuit, ~5 min, sans Google)

La page est en ligne sur **https://boulou1.github.io/lil-b2b-eric/**.
La liste des inscrits est rangée dans **Supabase** (base de données gratuite) : elle compte les 70 places et garde la liste, que toi seul peux voir.

## 1. Créer le projet Supabase
1. Va sur [supabase.com](https://supabase.com) → **Start your project** → **Continue with GitHub** (compte Boulou1).
2. **New project** :
   - Name : `lil-b2b-eric`
   - Database password : clique sur **Generate a password** (tu n'en auras pas besoin ensuite)
   - Region : **West EU (Paris)** ou **Central EU (Frankfurt)**
   - → **Create new project**, attends ~1 minute.

## 2. Créer la liste
1. Menu de gauche : **SQL Editor** → **New query**.
2. Colle tout le contenu du fichier **supabase.sql** (Claude l'a mis dans ton presse-papiers : ⌘V).
3. **Run**. Tu dois voir « Success. No rows returned ».

## 3. Envoyer 2 infos à Claude
Menu de gauche : **Project Settings** (⚙️) → **API** (ou **Data API** / **API Keys**). Copie :
- la **Project URL** (genre `https://abcdefgh.supabase.co`)
- la clé **anon public** (commence par `eyJ…`) ou **publishable** (commence par `sb_publishable_…`)

Ces deux infos sont **faites pour être publiques**, tu peux les envoyer sans risque.
⚠️ N'envoie **jamais** la clé `service_role` / `secret`.

Claude les met dans la page, republie, et les réservations s'ouvrent.

## Pendant la vente
- Chaque « ✅ J'ai payé » ajoute une ligne dans la liste.
- Pour la voir : Supabase → **Table Editor** → **inscriptions**. Ça marche aussi depuis le navigateur de ton téléphone.
- La colonne **paye_avec** dit Lydia ou Revolut. La case **verifie** est pour toi si tu veux cocher les paiements reçus.
- À 70 inscrits, la page affiche **« Sold out »**.
- Quelqu'un n'a pas vraiment payé ? Coche sa ligne → **Delete** : la place se libère.

## Récupérer la liste en Excel
Table Editor → **inscriptions** → bouton **Export** (ou **…**) → **Export to CSV**. Le fichier s'ouvre dans Excel ou Numbers.

## Le jour J
Ouvre la liste dans le Table Editor (ou l'export CSV) : les gens donnent leur prénom et leur nom à l'entrée.

## Changer le nombre de places
SQL Editor → `create or replace function capacite() returns int language sql immutable as $$ select 80 $$;` → **Run**. Dis-le aussi à Claude pour qu'il mette à jour l'affichage de la page.

## Bon à savoir
Un projet Supabase gratuit **se met en pause après 7 jours sans aucune visite**. Pendant la vente il y aura des visites, donc pas de souci ; si jamais il est en pause, clique sur **Restore** dans Supabase.
