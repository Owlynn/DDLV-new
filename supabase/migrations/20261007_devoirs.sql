-- Devoirs à rendre : un devoir = un exercice + un commentaire + une date limite,
-- visible par les élèves portant une des étiquettes ; chaque élève marque "j'ai rendu l'exercice".
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql et 20261007_suivi_seances.sql).
-- Ré-exécutable sans risque : ne supprime aucune donnée.

-- 1. Les devoirs
create table if not exists public.devoirs (
  id uuid primary key default gen_random_uuid(),
  -- Mêmes clés que les étiquettes de lib/student-tags.ts
  contexte text not null check (contexte in ('focus2026-2027', 'ateliers', 'cours')),
  date_limite date not null,
  exercice_id uuid references public.exercices (id) on delete set null,
  commentaire text,
  -- Étiquettes donnant accès au devoir
  etiquettes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devoirs_date_idx on public.devoirs (date_limite);
create index if not exists devoirs_etiquettes_idx on public.devoirs using gin (etiquettes);

-- 2. Les rendus : une ligne par élève et par devoir rendu (date_rendu = clic sur "J'ai rendu l'exercice")
create table if not exists public.devoirs_rendus (
  devoir_id uuid not null references public.devoirs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date_rendu timestamptz not null default now(),
  primary key (devoir_id, user_id)
);

-- 3. Droits
alter table public.devoirs enable row level security;
alter table public.devoirs_rendus enable row level security;
grant select, insert, update, delete on public.devoirs, public.devoirs_rendus to authenticated;
grant select, insert, update, delete on public.devoirs, public.devoirs_rendus to service_role;

drop policy if exists "devoirs: admin gère tout" on public.devoirs;
drop policy if exists "devoirs: lecture selon les étiquettes" on public.devoirs;
drop policy if exists "devoirs_rendus: admin gère tout" on public.devoirs_rendus;
drop policy if exists "devoirs_rendus: l'élève lit ses rendus" on public.devoirs_rendus;
drop policy if exists "devoirs_rendus: l'élève marque un rendu" on public.devoirs_rendus;
drop policy if exists "devoirs_rendus: l'élève annule un rendu" on public.devoirs_rendus;

create policy "devoirs: admin gère tout"
  on public.devoirs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "devoirs: lecture selon les étiquettes"
  on public.devoirs for select to authenticated
  using (exists (
    select 1 from public.student_tags st
    where st.user_id = auth.uid() and st.tags && devoirs.etiquettes
  ));

create policy "devoirs_rendus: admin gère tout"
  on public.devoirs_rendus for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "devoirs_rendus: l'élève lit ses rendus"
  on public.devoirs_rendus for select to authenticated
  using (user_id = auth.uid());

-- L'élève ne peut marquer comme rendu qu'un devoir qu'il voit (la règle de lecture de devoirs s'applique)
create policy "devoirs_rendus: l'élève marque un rendu"
  on public.devoirs_rendus for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.devoirs d where d.id = devoir_id));

create policy "devoirs_rendus: l'élève annule un rendu"
  on public.devoirs_rendus for delete to authenticated
  using (user_id = auth.uid());

-- 4. Les élèves voient aussi les exercices liés à un devoir visible (en plus de ceux des séances)
drop policy if exists "exercices: lecture via les séances visibles" on public.exercices;
drop policy if exists "exercices: lecture via séances ou devoirs visibles" on public.exercices;

create policy "exercices: lecture via séances ou devoirs visibles"
  on public.exercices for select to authenticated
  using (
    exists (select 1 from public.suivi_seances s where exercices.id = any (s.exercices))
    or exists (select 1 from public.devoirs d where d.exercice_id = exercices.id)
  );

-- 5. Devoirs de la Formation Focus 2026-2027 : les dates "Rendu devoir" du calendrier (lib/formation-focus.ts),
--    sans exercice ni commentaire pour l'instant ("Contenu à venir").
insert into public.devoirs (contexte, date_limite, etiquettes)
select 'focus2026-2027', d::date, array['focus2026-2027']
from unnest(array[
  '2026-10-16', '2026-11-13', '2026-11-27', '2026-12-18',
  '2027-01-15', '2027-01-29', '2027-02-12', '2027-02-26',
  '2027-03-12', '2027-03-26', '2027-04-09', '2027-04-23',
  '2027-05-14', '2027-05-28'
]) as d
where not exists (
  select 1 from public.devoirs x where x.contexte = 'focus2026-2027' and x.date_limite = d::date
);
