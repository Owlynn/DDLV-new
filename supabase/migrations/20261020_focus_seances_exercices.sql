-- Préparation des séances Focus : un ou plusieurs exercices de la bibliothèque (public.exercices) par pilier.
-- À exécuter dans Supabase → SQL Editor, après 20261020_focus_seances.sql. Ré-exécutable sans risque.

-- Ids de public.exercices, dans l'ordre prévu pour la séance (même principe que suivi_seances.exercices)
alter table public.focus_seance_piliers add column if not exists exercices uuid[] not null default '{}';
create index if not exists focus_seance_piliers_exercices_idx on public.focus_seance_piliers using gin (exercices);

-- Pas de clé étrangère possible sur un tableau : un exercice supprimé est retiré des piliers qui l'utilisent
create or replace function public.exercices_retirer_des_piliers_focus()
returns trigger
language plpgsql
as $$
begin
  update public.focus_seance_piliers
  set exercices = array_remove(exercices, old.id)
  where old.id = any (exercices);
  return old;
end;
$$;

drop trigger if exists exercices_retirer_des_piliers_focus on public.exercices;
create trigger exercices_retirer_des_piliers_focus
  after delete on public.exercices
  for each row execute function public.exercices_retirer_des_piliers_focus();
