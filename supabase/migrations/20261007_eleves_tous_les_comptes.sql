-- Une fiche élève pour chaque compte, existant ou futur.
-- À exécuter dans Supabase → SQL Editor après 20261007_eleves.sql.
-- Ré-exécutable sans risque : ne modifie pas les fiches déjà remplies.

-- 1. Comptes existants : une fiche vide pour ceux qui n'en ont pas encore
insert into public.eleves (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- 2. Comptes futurs : fiche créée automatiquement à la création du compte (invitation depuis /admin)
create or replace function public.creer_fiche_eleve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.eleves (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists creer_fiche_eleve on auth.users;
create trigger creer_fiche_eleve
  after insert on auth.users
  for each row execute function public.creer_fiche_eleve();
