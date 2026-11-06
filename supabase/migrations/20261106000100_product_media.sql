alter table public.products
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']::text[])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public read product media" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-media');

create policy "owner manage product media" on storage.objects for all to authenticated
using (bucket_id = 'product-media' and public.has_role('owner'))
with check (bucket_id = 'product-media' and public.has_role('owner'));
