-- Run using Supabase SQL Editor. Never expose service_role credentials to browsers.
create extension if not exists pgcrypto;
create table if not exists public.clothing_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 photo_path text not null, name text not null default '', category text not null, colors text[] not null default '{}',
 pattern text, season text[] not null default '{}', warmth_level int not null default 3 check(warmth_level between 1 and 5),
 formality text not null default 'casual', notes text, created_at timestamptz not null default now()
);
create table if not exists public.occasions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, description text not null default '', style_requirements text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.outfits (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 occasion_id uuid references public.occasions(id) on delete set null,
 item_ids uuid[] not null default '{}', weather_snapshot jsonb not null default '{}',
 reasoning text not null default '', is_favorite boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.clothing_items enable row level security;
alter table public.occasions enable row level security;
alter table public.outfits enable row level security;
drop policy if exists "items belong to caller" on public.clothing_items;
create policy "items belong to caller" on public.clothing_items for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "occasions belong to caller" on public.occasions;
create policy "occasions belong to caller" on public.occasions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "outfits belong to caller" on public.outfits;
create policy "outfits belong to caller" on public.outfits for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('wardrobe-photos','wardrobe-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
-- Storage object paths MUST start with user UUID: <auth.uid()>/<random-uuid>.jpg
drop policy if exists "read own wardrobe photos" on storage.objects;
create policy "read own wardrobe photos" on storage.objects for select to authenticated using(bucket_id='wardrobe-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "upload own wardrobe photos" on storage.objects;
create policy "upload own wardrobe photos" on storage.objects for insert to authenticated with check(bucket_id='wardrobe-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "delete own wardrobe photos" on storage.objects;
create policy "delete own wardrobe photos" on storage.objects for delete to authenticated using(bucket_id='wardrobe-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
