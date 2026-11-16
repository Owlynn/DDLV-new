-- Co-suivi Formation Focus : les enregistrements des devoirs (fichiers du Drive Focus attribués par un admin
-- à un élève et à un devoir), que tout le groupe Focus peut écouter et commenter.
-- Les commentaires des élèves sont publics (visibles du groupe) ; un admin peut écrire un commentaire non public,
-- visible seulement par l'élève concerné (et les admins).
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()
-- et 20261007_devoirs.sql). Ré-exécutable sans risque : ne supprime aucune donnée.

-- 0. Membre du groupe Focus 2026-2027 (étiquette de lib/student-tags.ts)
create or replace function public.is_focus()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_tags
    where user_id = auth.uid() and 'focus2026-2027' = any (tags)
  );
$$;

-- 1. Les enregistrements : un fichier du Drive = un rendu d'un élève pour un devoir
create table if not exists public.devoirs_enregistrements (
  id uuid primary key default gen_random_uuid(),
  devoir_id uuid not null references public.devoirs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  drive_file_id text not null unique, -- un fichier n'est attribué qu'une fois
  nom text not null,                  -- nom du fichier sur le Drive
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists devoirs_enregistrements_devoir_idx on public.devoirs_enregistrements (devoir_id);
create index if not exists devoirs_enregistrements_user_idx on public.devoirs_enregistrements (user_id);

-- 2. Les commentaires
create table if not exists public.devoirs_commentaires (
  id uuid primary key default gen_random_uuid(),
  enregistrement_id uuid not null references public.devoirs_enregistrements (id) on delete cascade,
  auteur_id uuid not null references auth.users (id) on delete cascade,
  contenu text not null check (length(trim(contenu)) > 0),
  public boolean not null default true, -- false : seulement l'élève de l'enregistrement et les admins
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devoirs_commentaires_enregistrement_idx on public.devoirs_commentaires (enregistrement_id);

-- 3. Droits
alter table public.devoirs_enregistrements enable row level security;
alter table public.devoirs_commentaires enable row level security;
grant select, insert, update, delete on public.devoirs_enregistrements, public.devoirs_commentaires to authenticated;
grant select, insert, update, delete on public.devoirs_enregistrements, public.devoirs_commentaires to service_role;

drop policy if exists "enregistrements: admin gère tout" on public.devoirs_enregistrements;
drop policy if exists "enregistrements: lecture par le groupe Focus" on public.devoirs_enregistrements;

create policy "enregistrements: admin gère tout"
  on public.devoirs_enregistrements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "enregistrements: lecture par le groupe Focus"
  on public.devoirs_enregistrements for select to authenticated
  using (public.is_focus());

drop policy if exists "commentaires: admin gère tout" on public.devoirs_commentaires;
drop policy if exists "commentaires: lecture" on public.devoirs_commentaires;
drop policy if exists "commentaires: un élève Focus commente" on public.devoirs_commentaires;
drop policy if exists "commentaires: l'auteur modifie" on public.devoirs_commentaires;
drop policy if exists "commentaires: l'auteur supprime" on public.devoirs_commentaires;

create policy "commentaires: admin gère tout"
  on public.devoirs_commentaires for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Publics : tout le groupe. Non publics : l'élève de l'enregistrement. Toujours : l'auteur.
create policy "commentaires: lecture"
  on public.devoirs_commentaires for select to authenticated
  using (
    auteur_id = auth.uid()
    or (public and public.is_focus())
    or exists (select 1 from public.devoirs_enregistrements e where e.id = enregistrement_id and e.user_id = auth.uid())
  );

-- Un élève Focus ne publie que des commentaires publics, signés de son nom
create policy "commentaires: un élève Focus commente"
  on public.devoirs_commentaires for insert to authenticated
  with check (auteur_id = auth.uid() and public and public.is_focus());

create policy "commentaires: l'auteur modifie"
  on public.devoirs_commentaires for update to authenticated
  using (auteur_id = auth.uid()) with check (auteur_id = auth.uid() and (public or public.is_admin()));

create policy "commentaires: l'auteur supprime"
  on public.devoirs_commentaires for delete to authenticated
  using (auteur_id = auth.uid());

-- 4. Noms affichés dans le co-suivi : prénom + initiale du nom, pour les élèves Focus et les admins.
--    La table eleves reste privée (téléphone…) : cette fonction n'expose que le nom, et seulement au groupe Focus.
create or replace function public.focus_noms()
returns table (user_id uuid, nom text, admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  select st.user_id,
         coalesce(nullif(trim(concat_ws(' ', e.prenom, left(e.nom, 1) || case when coalesce(e.nom, '') <> '' then '.' end)), ''), 'Élève'),
         'admin' = any (st.tags)
  from public.student_tags st
  left join public.eleves e on e.user_id = st.user_id
  where ('focus2026-2027' = any (st.tags) or 'admin' = any (st.tags))
    and (public.is_focus() or public.is_admin());
$$;

grant execute on function public.focus_noms() to authenticated;
grant execute on function public.is_focus() to authenticated;
