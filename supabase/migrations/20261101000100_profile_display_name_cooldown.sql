alter table public.profiles
  add column display_name_updated_at timestamptz;

create or replace function public.enforce_display_name_cooldown()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    if old.display_name_updated_at is not null
      and old.display_name_updated_at > timezone('utc', now()) - interval '14 days' then
      raise exception 'display_name_cooldown';
    end if;

    new.display_name_updated_at := timezone('utc', now());
  end if;

  return new;
end;
$$;

create trigger profiles_display_name_cooldown
before update of display_name on public.profiles
for each row execute function public.enforce_display_name_cooldown();
