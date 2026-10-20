-- Préparation des séances Focus : une séance peut être publiée pour les élèves de la Formation Focus 2026-2027.
-- Tant qu'elle n'est pas publiée, elle reste réservée aux admins. Une fois publiée, les élèves portant l'étiquette
-- focus2026-2027 la lisent (date, thème, piliers et exercices liés), sans pouvoir la modifier.
-- À exécuter dans Supabase → SQL Editor, après 20261020_focus_seances.sql et 20261020_focus_seances_exercices.sql.
-- Ré-exécutable sans risque.

alter table public.focus_seances add column if not exists publiee boolean not null default false;

drop policy if exists "focus_seances: élève Focus lit les séances publiées" on public.focus_seances;
drop policy if exists "focus_seance_piliers: lecture via les séances visibles" on public.focus_seance_piliers;
drop policy if exists "exercices: lecture via les séances Focus visibles" on public.exercices;

-- Élève : lit les séances publiées s'il porte l'étiquette de la formation
create policy "focus_seances: élève Focus lit les séances publiées"
  on public.focus_seances for select to authenticated
  using (
    publiee and exists (
      select 1 from public.student_tags st
      where st.user_id = auth.uid() and 'focus2026-2027' = any (st.tags)
    )
  );

-- Élève : lit les piliers des séances qu'il peut lire (la règle de focus_seances s'applique dans la sous-requête)
create policy "focus_seance_piliers: lecture via les séances visibles"
  on public.focus_seance_piliers for select to authenticated
  using (exists (select 1 from public.focus_seances s where s.id = focus_seance_piliers.seance_id));

-- Élève : lit les exercices liés à un pilier qu'il peut lire
create policy "exercices: lecture via les séances Focus visibles"
  on public.exercices for select to authenticated
  using (exists (select 1 from public.focus_seance_piliers p where exercices.id = any (p.exercices)));
