-- Hall de la Fama: hasta 5 juegos destacados por usuario en su biblioteca.

alter table public.user_game_library
  add column if not exists hall_of_fame boolean not null default false,
  add column if not exists hall_of_fame_date timestamptz;

create index if not exists user_game_library_hall_of_fame_idx
  on public.user_game_library (user_id)
  where hall_of_fame;

create or replace function public.enforce_hall_of_fame_limit()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
begin
  if not new.hall_of_fame then
    new.hall_of_fame_date := null;
    return new;
  end if;

  if tg_op = 'UPDATE' and old.hall_of_fame then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('hall_of_fame:' || new.user_id::text));

  select count(*) into current_count
  from public.user_game_library
  where user_id = new.user_id
    and hall_of_fame
    and game_id <> new.game_id;

  if current_count >= 5 then
    raise exception 'HALL_OF_FAME_FULL' using errcode = 'P0001';
  end if;

  new.hall_of_fame_date := coalesce(new.hall_of_fame_date, now());
  return new;
end;
$$;

drop trigger if exists user_game_library_hall_of_fame_limit on public.user_game_library;

create trigger user_game_library_hall_of_fame_limit
  before insert or update of hall_of_fame on public.user_game_library
  for each row
  execute function public.enforce_hall_of_fame_limit();
