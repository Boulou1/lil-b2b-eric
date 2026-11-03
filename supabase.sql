-- Billetterie LIL B2B ERIC : à coller une fois dans Supabase → SQL Editor → Run

-- Nombre total de places
create or replace function capacite() returns int
language sql immutable as $$ select 100 $$;

-- La liste des inscrits (visible uniquement par toi, dans le Table Editor)
create table if not exists inscriptions (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  prenom text not null,
  nom text not null,
  email text not null unique,
  tel text,
  paye_avec text,
  verifie boolean not null default false
);

-- Personne ne peut lire ou modifier la liste depuis la page : seulement via les fonctions ci-dessous
alter table inscriptions enable row level security;
revoke all on table inscriptions from anon, authenticated;

create or replace function places_restantes() returns int
language sql stable security definer set search_path = public as $$
  select greatest(capacite() - count(*), 0)::int from inscriptions
$$;

-- Contrôle avant d'envoyer la personne payer : renvoie les places restantes
create or replace function verifier(p_email text) returns int
language plpgsql stable security definer set search_path = public as $$
declare
  n int;
begin
  if coalesce(p_email, '') !~ '^\S+@\S+\.\S+$' then
    raise exception 'Remplis ton prénom, ton nom et un email valide.';
  end if;
  if exists (select 1 from inscriptions where email = lower(trim(p_email))) then
    raise exception 'Cet email est déjà sur la liste 🪩';
  end if;
  select count(*) into n from inscriptions;
  if n >= capacite() then
    raise exception 'C''est complet, plus aucune place disponible.';
  end if;
  return capacite() - n;
end
$$;

-- Quand la personne clique sur « J'ai payé »
create or replace function confirmer(p_prenom text, p_nom text, p_email text, p_tel text, p_moyen text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  if trim(coalesce(p_prenom, '')) = '' or trim(coalesce(p_nom, '')) = '' then
    raise exception 'Remplis ton prénom, ton nom et un email valide.';
  end if;
  -- Verrou : deux personnes qui confirment en même temps ne peuvent pas dépasser la jauge
  perform pg_advisory_xact_lock(2011);
  perform verifier(p_email);
  select count(*) into n from inscriptions;
  insert into inscriptions (prenom, nom, email, tel, paye_avec)
  values (trim(p_prenom), trim(p_nom), lower(trim(p_email)),
          nullif(trim(coalesce(p_tel, '')), ''), nullif(trim(coalesce(p_moyen, '')), ''));
  return json_build_object('numero', n + 1, 'restantes', capacite() - n - 1);
end
$$;

grant execute on function places_restantes() to anon;
grant execute on function verifier(text) to anon;
grant execute on function confirmer(text, text, text, text, text) to anon;
