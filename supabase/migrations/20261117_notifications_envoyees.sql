-- Notifications e-mail du co-suivi Focus (app/api/focus/notifications/route.ts) : on garde la trace de chaque
-- envoi pour ne pas prévenir deux fois (un commentaire = un e-mail ; un devoir rendu = un e-mail par 24 h,
-- même si l'élève clique « rendu » / « annuler » plusieurs fois).
-- Table lue et écrite uniquement par le serveur (clé secrète) : RLS activée, aucune règle pour les comptes connectés.
-- À exécuter dans Supabase → SQL Editor. Ré-exécutable sans risque.

create table if not exists public.notifications_envoyees (
  cle text primary key,           -- ex. 'commentaire:<id>' ou 'rendu:<devoir_id>:<user_id>'
  envoye_at timestamptz not null default now()
);

alter table public.notifications_envoyees enable row level security;
revoke all on public.notifications_envoyees from anon, authenticated;
grant select, insert, update, delete on public.notifications_envoyees to service_role;
