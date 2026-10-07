-- Suivi des séances : une ligne par séance (date, contexte, récap, exercices réalisés, étiquettes ayant accès).
-- À exécuter dans Supabase → SQL Editor (nécessite la migration 20261007_student_tags_admin_rls.sql pour is_admin()).

-- Bibliothèque d'exercices (version minimale, colonnes à compléter plus tard)
create table if not exists public.exercices (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tables d'une version précédente de ce fichier, remplacées par suivi_seances (elles étaient vides).
-- La règle de lecture des exercices pointait sur suivi_exercices : on la retire d'abord (recréée plus bas).
drop policy if exists "exercices: lecture via les séances visibles" on public.exercices;
drop table if exists public.suivi_exercices;
drop table if exists public.suivi;

create table if not exists public.suivi_seances (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  -- Mêmes clés que les étiquettes de lib/student-tags.ts
  contexte text not null check (contexte in ('focus2026-2027', 'ateliers', 'cours')),
  recap text,
  -- Exercices réalisés pendant la séance (ids de public.exercices), dans l'ordre de passage
  exercices uuid[] not null default '{}',
  -- Étiquettes donnant accès à la séance : tout élève portant au moins une de ces étiquettes peut la lire
  etiquettes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suivi_seances_date_idx on public.suivi_seances (date desc);
create index if not exists suivi_seances_etiquettes_idx on public.suivi_seances using gin (etiquettes);
create index if not exists suivi_seances_exercices_idx on public.suivi_seances using gin (exercices);

-- Droits
alter table public.exercices enable row level security;
alter table public.suivi_seances enable row level security;
grant select, insert, update, delete on public.exercices, public.suivi_seances to authenticated;
grant select, insert, update, delete on public.exercices, public.suivi_seances to service_role;

drop policy if exists "exercices: admin gère tout" on public.exercices;
drop policy if exists "exercices: lecture via les séances visibles" on public.exercices;
drop policy if exists "suivi_seances: admin gère tout" on public.suivi_seances;
drop policy if exists "suivi_seances: lecture selon les étiquettes" on public.suivi_seances;

-- Admin : tout faire
create policy "suivi_seances: admin gère tout"
  on public.suivi_seances for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "exercices: admin gère tout"
  on public.exercices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Élève : lit les séances dont une des étiquettes correspond aux siennes
create policy "suivi_seances: lecture selon les étiquettes"
  on public.suivi_seances for select to authenticated
  using (exists (
    select 1 from public.student_tags st
    where st.user_id = auth.uid() and st.tags && suivi_seances.etiquettes
  ));

-- Élève : voit uniquement les exercices utilisés dans une séance qu'il peut lire
-- (la règle de lecture de suivi_seances s'applique dans la sous-requête)
create policy "exercices: lecture via les séances visibles"
  on public.exercices for select to authenticated
  using (exists (
    select 1 from public.suivi_seances s
    where exercices.id = any (s.exercices)
  ));
