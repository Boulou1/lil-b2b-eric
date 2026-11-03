-- Emails aux inscrits, envoyés par Brevo (gratuit, 300 emails/jour).
-- La clé API Brevo et l'adresse d'expédition sont rangées dans le coffre Supabase
-- (Vault), sous les noms brevo_key et email_expediteur. Elles ne sont jamais dans ce dépôt.

create extension if not exists pg_net with schema extensions;

-- Envoie un email texte ; ne fait rien tant que Brevo n'est pas configuré
create or replace function envoyer_email(p_email text, p_nom text, p_sujet text, p_texte text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  cle text;
  expediteur text;
begin
  select decrypted_secret into cle from vault.decrypted_secrets where name = 'brevo_key';
  select decrypted_secret into expediteur from vault.decrypted_secrets where name = 'email_expediteur';
  if cle is null or expediteur is null then
    return false;
  end if;
  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'api-key', cle),
    body := jsonb_build_object(
      'sender', jsonb_build_object('name', 'LIL B2B ERIC', 'email', expediteur),
      'to', jsonb_build_array(jsonb_build_object('email', p_email, 'name', p_nom)),
      'subject', p_sujet,
      'textContent', p_texte
    )
  );
  return true;
end
$$;

-- 1. Confirmation automatique quand la personne clique sur « J'ai payé »
create or replace function envoyer_confirmation() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform envoyer_email(new.email, new.prenom || ' ' || new.nom,
    '🪩 T''es sur la liste – LIL B2B ERIC',
    format(E'Salut %s !\n\n'
      'C''est bon, tu es sur la liste pour LIL B2B ERIC 🪩\n\n'
      'Disco · House · Tek\n'
      'Vendredi 20 novembre, 21h – 2h\n'
      'Goldie – La Brasserie des Arts\n'
      '28 rue Saint-André des Arts, 75006 Paris\n\n'
      'À l''entrée, donne juste ton prénom et ton nom (%s %s).\n\n'
      'À vendredi !', new.prenom, new.prenom, new.nom));
  return new;
exception when others then
  -- Si l'email échoue, l'inscription reste valable
  return new;
end
$$;

drop trigger if exists email_confirmation on inscriptions;
create trigger email_confirmation
  after insert on inscriptions
  for each row execute function envoyer_confirmation();

-- 2. Relance pour quelqu'un dont le paiement n'est pas arrivé.
--    À lancer à la main dans le SQL Editor :  select relancer_impaye('email@exemple.fr');
create or replace function relancer_impaye(p_email text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  i inscriptions;
begin
  select * into i from inscriptions where email = lower(trim(p_email));
  if not found then
    return 'Pas sur la liste : ' || p_email;
  end if;
  if not envoyer_email(i.email, i.prenom || ' ' || i.nom,
    '⚠️ Paiement pas reçu – LIL B2B ERIC',
    format(E'Salut %s,\n\n'
      'On n''a pas reçu ton paiement de 10 € pour LIL B2B ERIC (vendredi 20 novembre).\n'
      'Tant qu''il n''est pas fait, tu n''as pas ta place.\n\n'
      'Pour la garder, paie ici en mettant « %s %s » dans le message :\n'
      'Lydia : https://pay.lydia.me/l?t=alberict541y\n'
      'Revolut : https://revolut.me/alberict01\n\n'
      'Si tu as déjà payé, réponds-nous avec une capture du paiement.\n\n'
      'À vendredi 🪩', i.prenom, i.prenom, i.nom)) then
    return 'Brevo pas encore configuré, rien envoyé';
  end if;
  return 'Relance envoyée à ' || i.prenom || ' ' || i.nom;
end
$$;

-- Ces fonctions ne sont pas appelables depuis la page
revoke all on function envoyer_email(text, text, text, text) from public, anon, authenticated;
revoke all on function relancer_impaye(text) from public, anon, authenticated;
