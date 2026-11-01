insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']::text[])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy "owner read payment proofs" on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and public.has_role('owner'));
create policy "owner manage payment proofs" on storage.objects for all to authenticated
using (bucket_id = 'payment-proofs' and public.has_role('owner'))
with check (bucket_id = 'payment-proofs' and public.has_role('owner'));
