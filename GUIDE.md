# Ta billetterie LIL B2B ERIC

- **Le lien à partager :** https://boulou1.github.io/lil-b2b-eric/
- **La liste des inscrits :** https://supabase.com/dashboard/project/heycdkoaaxdmqkidcild/editor (Table Editor → `inscriptions`). Connexion avec GitHub (Boulou1). Marche aussi depuis ton téléphone.

## Comment ça marche
1. La personne clique sur « Je prends ma place ! », remplit prénom, nom, email.
2. Elle paie 10 € avec Lydia ou Revolut en mettant son nom dans le message.
3. Elle clique sur « ✅ J'ai payé » → elle est ajoutée à la liste.
4. À 70 inscrits, la page affiche « Sold out ». Le nombre de places restantes n'est jamais affiché au public.

## Pendant la vente
- À chaque « J'ai payé », ton bot Telegram **@LilxAlbeDJbot** t'envoie la nouvelle place et la liste complète à jour.
- La colonne **paye_avec** dit Lydia ou Revolut. La case **verifie** est pour toi si tu veux cocher les paiements reçus.
- Quelqu'un n'a pas vraiment payé ? Coche sa ligne → **Delete rows** : la place se libère.

## Récupérer la liste en Excel
Table Editor → `inscriptions` → **Export** (ou le menu **…**) → **Export to CSV**. Ça s'ouvre dans Excel ou Numbers.

## Le jour J
Ouvre la liste sur ton téléphone : les gens donnent leur prénom et leur nom à l'entrée.

## Changer le nombre de places
Supabase → SQL Editor → colle `create or replace function capacite() returns int language sql immutable as $$ select 80 $$;` → Run. Dis-le aussi à Claude pour qu'il mette à jour l'affichage de la page.

## Bon à savoir
- Un projet Supabase gratuit **se met en pause après 7 jours sans aucune visite**. S'il est en pause, clique sur **Restore** dans Supabase (ça prend 1 minute).
- `supabase.sql` et `telegram.sql` sont le code qui a créé la liste et la notification : tu n'as pas besoin d'y toucher.
- Le token du bot est rangé dans Supabase (Vault), jamais sur GitHub. Pour en changer : BotFather → `/revoke`, puis SQL Editor → `select vault.update_secret((select id from vault.secrets where name = 'telegram_token'), 'NOUVEAU_TOKEN');`
