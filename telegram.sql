-- Notification Telegram à chaque inscription (déjà installé dans Supabase).
-- Le token du bot et ton chat id sont rangés dans le coffre Supabase (Vault),
-- sous les noms telegram_token et telegram_chat_id. Ils ne sont jamais dans ce dépôt.

create extension if not exists pg_net with schema extensions;

create or replace function notifier_telegram() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  token text;
  chat text;
  n int;
  liste text;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'telegram_token';
  select decrypted_secret into chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if token is null or chat is null then
    return new;
  end if;

  select count(*),
         string_agg(format('%s. %s %s%s', rn, prenom, nom, coalesce(' (' || paye_avec || ')', '')), E'\n' order by rn)
    into n, liste
    from (select row_number() over (order by id) as rn, * from inscriptions) t;

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || token || '/sendMessage',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'chat_id', chat,
      'text', left(format(E'✅ Nouvelle place %s/%s : %s %s%s\n\n🎟️ Liste (%s) :\n%s',
                          n, capacite(), new.prenom, new.nom,
                          coalesce(' — ' || new.paye_avec, ''), n, liste), 4000)
    )
  );
  return new;
exception when others then
  -- Si Telegram échoue, l'inscription reste valable
  return new;
end
$$;

drop trigger if exists apres_inscription on inscriptions;
create trigger apres_inscription
  after insert on inscriptions
  for each row execute function notifier_telegram();
