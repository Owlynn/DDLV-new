-- Fiche élève : une ligne par compte (auth.users ne stocke que l'email).
-- L'élève remplit prénom, nom et téléphone ; le groupe (élèves Focus) est réservé aux admins.
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()).
-- Ré-exécutable sans risque : ne supprime aucune donnée.

create table if not exists public.eleves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  nom text,
  telephone text,
  groupe text, -- nom du groupe (Formation Focus), modifiable par les admins uniquement
  updated_at timestamptz not null default now()
);

alter table public.eleves enable row level security;
grant select, insert, update, delete on public.eleves to authenticated;
grant select, insert, update, delete on public.eleves to service_role;

drop policy if exists "eleves: admin gère tout" on public.eleves;
drop policy if exists "eleves: l'élève lit sa fiche" on public.eleves;
drop policy if exists "eleves: l'élève crée sa fiche" on public.eleves;
drop policy if exists "eleves: l'élève modifie sa fiche" on public.eleves;

create policy "eleves: admin gère tout"
  on public.eleves for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "eleves: l'élève lit sa fiche"
  on public.eleves for select to authenticated
  using (user_id = auth.uid());

create policy "eleves: l'élève crée sa fiche"
  on public.eleves for insert to authenticated
  with check (user_id = auth.uid());

create policy "eleves: l'élève modifie sa fiche"
  on public.eleves for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Le groupe ne peut être fixé ou changé que par un admin : pour un élève, on garde l'ancienne valeur.
create or replace function public.eleves_protege_groupe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.groupe := null;
    else
      new.groupe := old.groupe;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists eleves_protege_groupe on public.eleves;
create trigger eleves_protege_groupe
  before insert or update on public.eleves
  for each row execute function public.eleves_protege_groupe();
