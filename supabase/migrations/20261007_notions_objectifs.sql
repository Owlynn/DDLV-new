-- Notions et objectifs : une liste réutilisable (table notions_objectifs),
-- et chaque exercice référence les notions choisies (exercices.notions_objectifs = liste d'ids).
-- Remplace l'ancienne colonne texte exercices.notions_objectifs (la table exercices était vide).
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()).

-- 1. La liste des notions et objectifs
create table if not exists public.notions_objectifs (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  created_at timestamptz not null default now()
);

-- Pas de doublon, sans tenir compte des majuscules ("Pulse" = "pulse")
create unique index if not exists notions_objectifs_libelle_idx on public.notions_objectifs (lower(libelle));

alter table public.notions_objectifs enable row level security;
grant select, insert, update, delete on public.notions_objectifs to authenticated;
grant select, insert, update, delete on public.notions_objectifs to service_role;

drop policy if exists "notions_objectifs: admin gère tout" on public.notions_objectifs;
drop policy if exists "notions_objectifs: lecture" on public.notions_objectifs;

create policy "notions_objectifs: admin gère tout"
  on public.notions_objectifs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Les libellés ne sont pas sensibles : tout compte connecté peut les lire (affichage dans les exercices)
create policy "notions_objectifs: lecture"
  on public.notions_objectifs for select to authenticated
  using (true);

-- 2. Dans les exercices : la colonne texte devient une liste d'ids de notions.
--    Conditionnel pour que le fichier reste ré-exécutable sans effacer les notions déjà choisies.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices' and column_name = 'notions_objectifs' and data_type = 'text'
  ) then
    alter table public.exercices drop column notions_objectifs;
  end if;
end $$;

alter table public.exercices add column if not exists notions_objectifs uuid[] not null default '{}';
create index if not exists exercices_notions_idx on public.exercices using gin (notions_objectifs);
