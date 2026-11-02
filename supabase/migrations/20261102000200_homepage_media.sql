insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-media', 'homepage-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']::text[])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy "public read homepage media" on storage.objects for select to anon, authenticated
using (bucket_id = 'homepage-media');

create policy "owner manage homepage media" on storage.objects for all to authenticated
using (bucket_id = 'homepage-media' and public.has_role('owner'))
with check (bucket_id = 'homepage-media' and public.has_role('owner'));
