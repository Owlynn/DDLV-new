-- Préparation des séances Focus : notes privées, une par pilier, jamais visibles des élèves.
-- Table séparée de focus_seance_piliers : la RLS filtre des lignes, pas des colonnes, donc une colonne
-- dans une table lisible par les élèves serait récupérable par l'API. Ici, seuls les admins ont accès.
-- À exécuter dans Supabase → SQL Editor, après 20261020_focus_seances.sql. Ré-exécutable sans risque.

create table if not exists public.focus_seance_notes (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.focus_seances (id) on delete cascade,
  pilier text not null check (pilier in ('fondations', 'posture', 'collectif', 'autonome', 'scene')),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (seance_id, pilier) -- permet l'enregistrement par upsert
);

drop trigger if exists focus_seance_notes_maj_updated_at on public.focus_seance_notes;
create trigger focus_seance_notes_maj_updated_at
  before insert or update on public.focus_seance_notes
  for each row execute function public.focus_seances_maj_updated_at();

-- Droits : admins uniquement, aucune règle de lecture pour les élèves
alter table public.focus_seance_notes enable row level security;
revoke all on public.focus_seance_notes from anon;
grant select, insert, update, delete on public.focus_seance_notes to authenticated;
grant select, insert, update, delete on public.focus_seance_notes to service_role;

drop policy if exists "focus_seance_notes: admin gère tout" on public.focus_seance_notes;
create policy "focus_seance_notes: admin gère tout"
  on public.focus_seance_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
