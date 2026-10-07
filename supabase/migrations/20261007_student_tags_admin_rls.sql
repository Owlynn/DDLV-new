-- Sécurise student_tags : chaque élève ne lit que ses propres étiquettes,
-- seuls les comptes étiquetés "admin" peuvent lire/modifier celles des autres.
-- À exécuter dans Supabase → SQL Editor.

-- 0. IMPORTANT : s'assurer que ton compte a bien l'étiquette "admin" AVANT d'appliquer les règles,
--    sinon plus personne ne pourra gérer les étiquettes. Remplace l'email ci-dessous.
insert into public.student_tags (user_id, tags)
select id, array['admin'] from auth.users where email = 'REMPLACE-PAR-TON-EMAIL-ADMIN'
on conflict (user_id) do update
  set tags = array(select distinct unnest(public.student_tags.tags || array['admin']));

-- 1. Fonction "suis-je admin ?" (security definer pour éviter la récursion des règles RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_tags
    where user_id = auth.uid() and 'admin' = any(tags)
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2. Supprime les anciennes règles (qui laissaient tout compte connecté tout modifier)
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'student_tags' loop
    execute format('drop policy %I on public.student_tags', p.policyname);
  end loop;
end $$;

-- 3. Nouvelles règles
alter table public.student_tags enable row level security;
grant select, insert, update, delete on public.student_tags to authenticated;
-- Le serveur (requireAdmin, clé secrète) doit pouvoir lire les étiquettes.
grant select, insert, update, delete on public.student_tags to service_role;

create policy "student_tags: lire les siennes, ou tout si admin"
  on public.student_tags for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "student_tags: admin peut ajouter"
  on public.student_tags for insert to authenticated
  with check (public.is_admin());

create policy "student_tags: admin peut modifier"
  on public.student_tags for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "student_tags: admin peut supprimer"
  on public.student_tags for delete to authenticated
  using (public.is_admin());
