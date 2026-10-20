-- Préparation des séances de la Formation Focus (outil interne de /admin).
-- Une séance = une date (texte libre, ex. « 22/10 ») + un thème, et un texte par pilier.
-- Strictement réservé aux admins : aucune règle de lecture pour les élèves ni pour le public.
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()).
-- Ré-exécutable sans risque.

create table if not exists public.focus_seances (
  id uuid primary key default gen_random_uuid(),
  date text not null default '',
  theme text not null default '',
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists focus_seances_ordre_idx on public.focus_seances (ordre);

create table if not exists public.focus_seance_piliers (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.focus_seances (id) on delete cascade,
  pilier text not null check (pilier in ('fondations', 'posture', 'collectif', 'autonome', 'scene')),
  contenu text not null default '',
  updated_at timestamptz not null default now(),
  unique (seance_id, pilier) -- permet l'enregistrement par upsert
);

-- updated_at de la séance : mis à jour à chaque modification de la séance ou de l'un de ses piliers
create or replace function public.focus_seances_maj_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists focus_seances_maj_updated_at on public.focus_seances;
create trigger focus_seances_maj_updated_at
  before update on public.focus_seances
  for each row execute function public.focus_seances_maj_updated_at();

drop trigger if exists focus_seance_piliers_maj_updated_at on public.focus_seance_piliers;
create trigger focus_seance_piliers_maj_updated_at
  before insert or update on public.focus_seance_piliers
  for each row execute function public.focus_seances_maj_updated_at();

create or replace function public.focus_seance_piliers_touche_seance()
returns trigger
language plpgsql
as $$
begin
  update public.focus_seances set updated_at = now() where id = new.seance_id;
  return new;
end;
$$;

drop trigger if exists focus_seance_piliers_touche_seance on public.focus_seance_piliers;
create trigger focus_seance_piliers_touche_seance
  after insert or update on public.focus_seance_piliers
  for each row execute function public.focus_seance_piliers_touche_seance();

-- Au moins une séance doit toujours rester
create or replace function public.focus_seances_garder_une()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.focus_seances) then
    raise exception 'Au moins une séance doit rester.';
  end if;
  return null;
end;
$$;

drop trigger if exists focus_seances_garder_une on public.focus_seances;
create trigger focus_seances_garder_une
  after delete on public.focus_seances
  for each statement execute function public.focus_seances_garder_une();

-- Droits : admins uniquement
alter table public.focus_seances enable row level security;
alter table public.focus_seance_piliers enable row level security;
revoke all on public.focus_seances, public.focus_seance_piliers from anon;
grant select, insert, update, delete on public.focus_seances, public.focus_seance_piliers to authenticated;
grant select, insert, update, delete on public.focus_seances, public.focus_seance_piliers to service_role;

drop policy if exists "focus_seances: admin gère tout" on public.focus_seances;
drop policy if exists "focus_seance_piliers: admin gère tout" on public.focus_seance_piliers;

create policy "focus_seances: admin gère tout"
  on public.focus_seances for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "focus_seance_piliers: admin gère tout"
  on public.focus_seance_piliers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed : les deux premières séances, uniquement si la table est vide (les 5 piliers restent vides)
insert into public.focus_seances (date, theme, ordre)
select s.date, s.theme, s.ordre
from (values ('07/10', '', 1), ('22/10', 'Prendre son temps et communiquer', 2)) as s (date, theme, ordre)
where not exists (select 1 from public.focus_seances);
