-- Devoirs à rendre rattachés à une séance Focus : ils s'affichent dans le bloc « Le travail autonome »
-- de la séance (/admin → Préparation des séances Focus, et espace élève → Séances).
-- Un devoir peut rester sans séance (il apparaît toujours dans « Devoirs à rendre »).
-- À exécuter dans Supabase → SQL Editor, après 20261007_devoirs.sql et 20261020_focus_seances.sql.
-- Ré-exécutable sans risque : ne supprime aucune donnée. Les droits de public.devoirs ne changent pas.

alter table public.devoirs
  add column if not exists seance_id uuid references public.focus_seances (id) on delete set null;

create index if not exists devoirs_seance_idx on public.devoirs (seance_id);
