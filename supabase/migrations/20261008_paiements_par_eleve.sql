-- Paiements : une ligne par élève (montant total dû) + les versements qui viennent s'y soustraire.
-- Remplace la table « une ligne par échéance » de 20261008_paiements.sql : ses lignes éventuelles sont reprises
-- (montants dus additionnés par élève, montants payés convertis en versements), puis elle est supprimée.
-- Les admins gèrent tout ; un élève lit uniquement sa ligne et ses versements.
-- Quand un compte élève est supprimé, sa ligne est conservée (user_id passe à null) et reste identifiable
-- grâce à eleve_nom, recopié automatiquement à l'enregistrement.
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()).
-- Ré-exécutable sans risque.

create table if not exists public.paiements_eleves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  eleve_nom text, -- « Prénom Nom » (ou email) de l'élève, figé pour garder la trace après suppression du compte
  montant_du numeric(10, 2) not null default 0 check (montant_du >= 0),
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.versements (
  id uuid primary key default gen_random_uuid(),
  paiement_eleve_id uuid not null references public.paiements_eleves (id) on delete cascade,
  date date not null default current_date,
  montant numeric(10, 2) not null check (montant > 0),
  moyen_paiement text, -- virement, chèque, espèces, CB…
  commentaire text,
  created_at timestamptz not null default now()
);

create index if not exists versements_paiement_eleve_idx on public.versements (paiement_eleve_id, date);

-- Recopie le nom de l'élève (fiche, sinon email) à chaque enregistrement lié à un compte.
create or replace function public.paiements_eleves_avant_enregistrement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    select coalesce(nullif(trim(concat_ws(' ', e.prenom, e.nom)), ''), u.email)
    into new.eleve_nom
    from auth.users u
    left join public.eleves e on e.user_id = u.id
    where u.id = new.user_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists paiements_eleves_avant_enregistrement on public.paiements_eleves;
create trigger paiements_eleves_avant_enregistrement
  before insert or update on public.paiements_eleves
  for each row execute function public.paiements_eleves_avant_enregistrement();

-- Reprise de l'ancienne table (une ligne par échéance), si elle existe
do $$
begin
  if to_regclass('public.paiements') is not null then
    insert into public.paiements_eleves (user_id, eleve_nom, montant_du)
    select user_id, max(eleve_nom), sum(montant_du)
    from public.paiements
    where user_id is not null
    group by user_id
    on conflict (user_id) do nothing;

    -- Lignes d'élèves déjà supprimés : une ligne par nom
    insert into public.paiements_eleves (eleve_nom, montant_du)
    select eleve_nom, sum(montant_du)
    from public.paiements
    where user_id is null
    group by eleve_nom;

    insert into public.versements (paiement_eleve_id, date, montant, moyen_paiement, commentaire)
    select pe.id, p.date, p.montant_paye, p.moyen_paiement, nullif(concat_ws(' — ', p.libelle, p.commentaire), '')
    from public.paiements p
    join public.paiements_eleves pe
      on (p.user_id is not null and pe.user_id = p.user_id)
      or (p.user_id is null and pe.user_id is null and pe.eleve_nom is not distinct from p.eleve_nom)
    where p.montant_paye > 0;

    drop table public.paiements;
  end if;
end;
$$;

drop function if exists public.paiements_avant_enregistrement();

-- Droits
alter table public.paiements_eleves enable row level security;
alter table public.versements enable row level security;
grant select, insert, update, delete on public.paiements_eleves, public.versements to authenticated;
grant select, insert, update, delete on public.paiements_eleves, public.versements to service_role;

drop policy if exists "paiements_eleves: admin gère tout" on public.paiements_eleves;
drop policy if exists "paiements_eleves: l'élève lit la sienne" on public.paiements_eleves;
drop policy if exists "versements: admin gère tout" on public.versements;
drop policy if exists "versements: l'élève lit les siens" on public.versements;

create policy "paiements_eleves: admin gère tout"
  on public.paiements_eleves for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "paiements_eleves: l'élève lit la sienne"
  on public.paiements_eleves for select to authenticated
  using (user_id = auth.uid());

create policy "versements: admin gère tout"
  on public.versements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- La règle de lecture de paiements_eleves s'applique dans la sous-requête
create policy "versements: l'élève lit les siens"
  on public.versements for select to authenticated
  using (exists (select 1 from public.paiements_eleves pe where pe.id = versements.paiement_eleve_id));
