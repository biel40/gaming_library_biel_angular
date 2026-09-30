-- Hall de la Fama: amplía el límite de 5 a 6 juegos por usuario.
-- Solo redefine la función del trigger; el trigger existente la usa automáticamente.

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

  if current_count >= 6 then
    raise exception 'HALL_OF_FAME_FULL' using errcode = 'P0001';
  end if;

  new.hall_of_fame_date := coalesce(new.hall_of_fame_date, now());
  return new;
end;
$$;
