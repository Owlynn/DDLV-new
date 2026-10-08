-- Suivi des paiements : une ligne par échéance (un versement prévu : son montant dû et ce qui a été payé).
-- Les admins gèrent tout ; un élève lit uniquement ses propres paiements.
-- Quand un compte élève est supprimé, ses paiements sont conservés (user_id passe à null) et restent
-- identifiables grâce à eleve_nom, recopié automatiquement à l'enregistrement.
-- À exécuter dans Supabase → SQL Editor (nécessite 20261007_student_tags_admin_rls.sql pour is_admin()).
-- Ré-exécutable sans risque : ne supprime aucune donnée.

create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  eleve_nom text, -- « Prénom Nom » (ou email) de l'élève, figé pour garder la trace après suppression du compte
  date date not null default current_date,
  libelle text not null, -- ex. « Formation Focus – 1er versement », « Cours octobre »
  -- Mêmes clés que les étiquettes de lib/student-tags.ts (optionnel)
  contexte text check (contexte in ('focus2026-2027', 'ateliers', 'cours')),
  montant_du numeric(10, 2) not null check (montant_du >= 0),
  montant_paye numeric(10, 2) not null default 0 check (montant_paye >= 0),
  echeance date, -- date limite de paiement
  moyen_paiement text, -- virement, chèque, espèces, CB…
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paiements_user_id_idx on public.paiements (user_id);
create index if not exists paiements_date_idx on public.paiements (date desc);

-- Recopie le nom de l'élève (fiche, sinon email) à chaque enregistrement lié à un compte.
create or replace function public.paiements_avant_enregistrement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    select coalesce(
      nullif(trim(concat_ws(' ', e.prenom, e.nom)), ''),
      u.email
    )
    into new.eleve_nom
    from auth.users u
    left join public.eleves e on e.user_id = u.id
    where u.id = new.user_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists paiements_avant_enregistrement on public.paiements;
create trigger paiements_avant_enregistrement
  before insert or update on public.paiements
  for each row execute function public.paiements_avant_enregistrement();

-- Droits
alter table public.paiements enable row level security;
grant select, insert, update, delete on public.paiements to authenticated;
grant select, insert, update, delete on public.paiements to service_role;

drop policy if exists "paiements: admin gère tout" on public.paiements;
drop policy if exists "paiements: l'élève lit les siens" on public.paiements;

create policy "paiements: admin gère tout"
  on public.paiements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "paiements: l'élève lit les siens"
  on public.paiements for select to authenticated
  using (user_id = auth.uid());
