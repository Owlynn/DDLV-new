-- Préparation des séances Focus : une note privée générale par séance, en plus des notes par pilier.
-- Elle est stockée dans focus_seance_notes avec pilier = 'general' : mêmes droits (admins uniquement).
-- À exécuter dans Supabase → SQL Editor, après 20261020_focus_seances_notes_privees.sql. Ré-exécutable sans risque.

alter table public.focus_seance_notes drop constraint if exists focus_seance_notes_pilier_check;
alter table public.focus_seance_notes add constraint focus_seance_notes_pilier_check
  check (pilier in ('general', 'fondations', 'posture', 'collectif', 'autonome', 'scene'));
