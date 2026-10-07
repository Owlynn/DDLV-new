-- Exercices : ajout du champ "notions et objectifs".
-- (La colonne `description` existante sert de "description de l'exercice".)
-- À exécuter dans Supabase → SQL Editor. Ne supprime rien.

alter table public.exercices add column if not exists notions_objectifs text;
